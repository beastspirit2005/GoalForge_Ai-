"""Escalation service — auto-detect and escalate at-risk goals."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.escalation import Escalation
from app.models.goal import Goal
from app.models.user import User
from app.services.notification_service import create_notification


async def check_and_escalate(db: AsyncSession) -> list[dict]:
    """Scan for goals that need escalation (High risk, low progress)."""
    result = await db.execute(
        select(Goal)
        .where(Goal.risk == "High", Goal.status.notin_(["completed", "archived"]))
    )
    high_risk_goals = list(result.scalars().all())

    escalated = []
    for goal in high_risk_goals:
        # Check if already escalated and still open
        existing = await db.execute(
            select(Escalation).where(
                Escalation.goal_id == goal.id,
                Escalation.status == "open",
            )
        )
        if existing.scalar_one_or_none():
            continue

        # Find manager
        user_result = await db.execute(select(User).where(User.id == goal.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            continue

        manager_id = user.manager_id

        severity = "critical" if goal.progress < 30 else "high"
        reason = f"Goal '{goal.title}' is at High risk with only {goal.progress}% progress."
        if goal.deadline:
            reason += f" Deadline: {goal.deadline}."

        esc = Escalation(
            goal_id=goal.id,
            user_id=user.id,
            escalated_to=manager_id,
            reason=reason,
            severity=severity,
            status="open",
        )
        db.add(esc)
        await db.flush()
        await db.refresh(esc)

        # Notify manager
        if manager_id:
            await create_notification(
                db,
                user_id=manager_id,
                title="⚠️ Goal Escalation",
                message=reason,
                notif_type="risk_alert",
            )

        escalated.append({
            "id": esc.id,
            "goal_id": goal.id,
            "goal_title": goal.title,
            "user_name": user.name,
            "severity": severity,
            "reason": reason,
        })

    return escalated


async def get_escalations(db: AsyncSession, status: str | None = None) -> list[dict]:
    """Get all escalations, optionally filtered by status."""
    query = select(Escalation, Goal.title, User.name).join(
        Goal, Escalation.goal_id == Goal.id
    ).join(
        User, Escalation.user_id == User.id
    ).order_by(Escalation.created_at.desc())

    if status:
        query = query.where(Escalation.status == status)

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": esc.id,
            "goal_id": esc.goal_id,
            "goal_title": title,
            "user_name": name,
            "user_id": esc.user_id,
            "escalated_to": esc.escalated_to,
            "reason": esc.reason,
            "severity": esc.severity,
            "status": esc.status,
            "resolution_note": esc.resolution_note,
            "created_at": str(esc.created_at) if esc.created_at else None,
            "resolved_at": str(esc.resolved_at) if esc.resolved_at else None,
        }
        for esc, title, name in rows
    ]


async def resolve_escalation(db: AsyncSession, escalation_id: int, note: str = "") -> dict | None:
    """Mark an escalation as resolved."""
    result = await db.execute(
        select(Escalation).where(Escalation.id == escalation_id)
    )
    esc = result.scalar_one_or_none()
    if not esc:
        return None

    esc.status = "resolved"
    esc.resolution_note = note
    esc.resolved_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(esc)

    return {
        "id": esc.id,
        "status": esc.status,
        "resolution_note": esc.resolution_note,
    }


async def acknowledge_escalation(db: AsyncSession, escalation_id: int) -> dict | None:
    """Mark an escalation as acknowledged."""
    result = await db.execute(
        select(Escalation).where(Escalation.id == escalation_id)
    )
    esc = result.scalar_one_or_none()
    if not esc:
        return None

    esc.status = "acknowledged"
    await db.flush()
    await db.refresh(esc)

    return {"id": esc.id, "status": esc.status}
