"""Analytics service – aggregated organization metrics."""

from sqlalchemy import case, cast, Float, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkin import Checkin
from app.models.goal import Goal
from app.models.user import User


async def get_overview(db: AsyncSession) -> dict:
    # Total users
    user_count = await db.execute(select(func.count()).select_from(User))
    total_users = user_count.scalar() or 0

    # Total goals
    goal_count = await db.execute(select(func.count()).select_from(Goal))
    total_goals = goal_count.scalar() or 0

    # Average progress
    avg_result = await db.execute(select(func.coalesce(func.avg(Goal.progress), 0.0)))
    avg_progress = round(float(avg_result.scalar() or 0), 1)

    # Overdue check-ins (goals with no check-in)
    goals_with_checkins = await db.execute(
        select(func.count(func.distinct(Checkin.goal_id)))
    )
    goals_checked = goals_with_checkins.scalar() or 0
    overdue_checkins = max(0, total_goals - goals_checked)

    return {
        "total_users": total_users,
        "total_goals": total_goals,
        "avg_progress": avg_progress,
        "overdue_checkins": overdue_checkins,
    }


async def get_department_stats(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(
            User.department,
            func.count(Goal.id).label("goals"),
            func.coalesce(func.avg(Goal.progress), 0.0).label("progress"),
        )
        .join(Goal, Goal.user_id == User.id)
        .where(User.department.isnot(None))
        .group_by(User.department)
        .order_by(func.avg(Goal.progress).desc())
    )
    return [
        {"name": row.department, "goals": row.goals, "progress": round(float(row.progress), 1)}
        for row in result.all()
    ]


async def get_risk_distribution(db: AsyncSession) -> list[dict]:
    result = await db.execute(
        select(Goal.risk, func.count().label("count"))
        .group_by(Goal.risk)
    )
    return [{"risk": row.risk, "count": row.count} for row in result.all()]


async def get_momentum(db: AsyncSession) -> list[dict]:
    """
    Weekly momentum: average progress across all goals.
    For a hackathon, we generate a simple 5-week view from current data.
    """
    result = await db.execute(select(func.coalesce(func.avg(Goal.progress), 0.0)))
    current_avg = float(result.scalar() or 0)

    # Simulate a 5-week momentum curve based on current average
    weeks = []
    for i in range(5):
        factor = max(0.3, (i + 1) / 5)
        weeks.append({"week": f"W{i + 1}", "value": round(current_avg * factor, 1)})
    return weeks
