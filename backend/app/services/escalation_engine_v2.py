"""SLA Escalation Engine V2 — multi-tier auto-escalation at 3/7/14 days overdue."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.escalation import Escalation
from app.models.user import User
from app.services.notification_service import create_notification


async def scan_sla_violations(db: AsyncSession) -> dict:
    """
    Scan all goals for SLA violations.

    Tiers:
    - 3 days late → "warning" → notify manager
    - 7 days late → "critical" → notify admin + department head
    - 14 days late → "executive" → flag for executive review
    """
    now = datetime.now(timezone.utc)
    escalations_created = []

    # Check goals with deadlines
    goals_result = await db.execute(
        select(Goal).where(
            Goal.status.notin_(["completed", "archived"]),
            Goal.deadline.isnot(None),
        )
    )
    goals = list(goals_result.scalars().all())

    for goal in goals:
        deadline = goal.deadline
        if hasattr(deadline, 'tzinfo') and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)

        if deadline >= now:
            continue  # Not overdue

        days_overdue = (now - deadline).days

        if days_overdue < 3:
            continue  # Within grace period

        # Determine SLA tier
        if days_overdue >= 14:
            tier = "executive"
            severity = "critical"
        elif days_overdue >= 7:
            tier = "critical"
            severity = "critical"
        else:
            tier = "warning"
            severity = "high"

        # Check if escalation already exists at this tier
        existing = await db.execute(
            select(Escalation).where(
                Escalation.goal_id == goal.id,
                Escalation.severity == severity,
                Escalation.status.in_(["open", "acknowledged"]),
            )
        )
        if existing.scalar_one_or_none():
            continue  # Already escalated at this tier

        # Get goal owner
        user_result = await db.execute(select(User).where(User.id == goal.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        reason = f"Goal '{goal.title}' is {days_overdue} days overdue (SLA tier: {tier}). Progress: {goal.progress}%."

        esc = Escalation(
            goal_id=goal.id,
            user_id=user.id,
            escalated_to=user.manager_id,
            reason=reason,
            severity=severity,
            status="open",
        )
        db.add(esc)
        await db.flush()
        await db.refresh(esc)

        # Notify based on tier
        if tier == "warning" and user.manager_id:
            await create_notification(
                db,
                user_id=user.manager_id,
                title="⚠️ SLA Warning",
                message=reason,
                notif_type="risk_alert",
            )
        elif tier in ("critical", "executive"):
            # Notify manager
            if user.manager_id:
                await create_notification(
                    db,
                    user_id=user.manager_id,
                    title="🚨 SLA Critical",
                    message=reason,
                    notif_type="risk_alert",
                )
            # Also notify all admins
            admins_result = await db.execute(
                select(User).where(User.role.in_(["admin", "super_admin"]))
            )
            for admin in admins_result.scalars().all():
                await create_notification(
                    db,
                    user_id=admin.id,
                    title="🚨 SLA Critical Escalation",
                    message=reason,
                    notif_type="risk_alert",
                )

        escalations_created.append({
            "id": esc.id,
            "goal_id": goal.id,
            "goal_title": goal.title,
            "days_overdue": days_overdue,
            "tier": tier,
            "severity": severity,
            "user_name": user.name,
        })

    return {
        "scan_time": now.isoformat(),
        "total_escalations": len(escalations_created),
        "escalations": escalations_created,
    }
