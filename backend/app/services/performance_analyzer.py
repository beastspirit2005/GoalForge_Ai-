"""Performance Analyzer — computes trends and productivity insights."""

from datetime import datetime, timezone, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.checkin import Checkin
from app.models.user import User


async def compute_performance_trend(
    db: AsyncSession,
    user_id: int,
    period_days: int = 90,
) -> dict:
    """Compute performance trend (Improving, Stable, Declining) over a period."""
    now = datetime.now(timezone.utc)

    # Split period into two halves
    half_period = period_days // 2
    midpoint = now - timedelta(days=half_period)
    start = now - timedelta(days=period_days)

    # First half metrics
    first_half_result = await db.execute(
        select(func.avg(Goal.progress))
        .where(
            Goal.user_id == user_id,
            Goal.updated_at >= start,
            Goal.updated_at < midpoint,
        )
    )
    first_half_avg = first_half_result.scalar() or 0

    # Second half metrics
    second_half_result = await db.execute(
        select(func.avg(Goal.progress))
        .where(
            Goal.user_id == user_id,
            Goal.updated_at >= midpoint,
        )
    )
    second_half_avg = second_half_result.scalar() or 0

    # Determine trend
    diff = second_half_avg - first_half_avg
    if diff > 10:
        trend_status = "improving"
        trend_emoji = "📈"
    elif diff < -10:
        trend_status = "declining"
        trend_emoji = "📉"
    else:
        trend_status = "stable"
        trend_emoji = "➡️"

    # Count completed goals in period
    completed_result = await db.execute(
        select(func.count()).select_from(Goal)
        .where(
            Goal.user_id == user_id,
            Goal.status == "completed",
            Goal.updated_at >= start,
        )
    )
    completed_in_period = completed_result.scalar() or 0

    # Check-in frequency
    checkin_result = await db.execute(
        select(func.count()).select_from(Checkin)
        .where(
            Checkin.user_id == user_id,
            Checkin.created_at >= start,
        )
    )
    checkin_count = checkin_result.scalar() or 0

    return {
        "user_id": user_id,
        "period_days": period_days,
        "trend_status": trend_status,
        "trend_emoji": trend_emoji,
        "first_half_avg_progress": round(first_half_avg, 1),
        "second_half_avg_progress": round(second_half_avg, 1),
        "progress_change": round(diff, 1),
        "goals_completed_in_period": completed_in_period,
        "checkin_frequency": checkin_count,
    }


async def get_productivity_insights(
    db: AsyncSession,
    manager_id: int | None = None,
) -> dict:
    """Get team-level productivity insights."""
    query = select(User).where(User.is_active == True, User.role.in_(["employee", "team_lead"]))
    if manager_id:
        query = query.where(User.manager_id == manager_id)

    users_result = await db.execute(query)
    team = list(users_result.scalars().all())

    if not team:
        return {"message": "No team members found", "insights": []}

    insights = []
    total_progress = 0
    improving_count = 0
    declining_count = 0

    for member in team:
        trend = await compute_performance_trend(db, member.id, period_days=30)
        total_progress += trend["second_half_avg_progress"]

        if trend["trend_status"] == "improving":
            improving_count += 1
        elif trend["trend_status"] == "declining":
            declining_count += 1

        insights.append({
            "user_id": member.id,
            "name": member.name,
            "department": member.department,
            "trend": trend["trend_status"],
            "trend_emoji": trend["trend_emoji"],
            "avg_progress": trend["second_half_avg_progress"],
            "goals_completed": trend["goals_completed_in_period"],
        })

    avg_team_progress = total_progress / max(len(team), 1)

    # Sort by progress descending to show top performers first
    insights.sort(key=lambda x: x["avg_progress"], reverse=True)

    return {
        "team_size": len(team),
        "avg_team_progress": round(avg_team_progress, 1),
        "improving": improving_count,
        "declining": declining_count,
        "stable": len(team) - improving_count - declining_count,
        "team_members": insights,
        "top_performers": insights[:3] if len(insights) >= 3 else insights,
        "needs_attention": [m for m in insights if m["trend"] == "declining"],
    }
