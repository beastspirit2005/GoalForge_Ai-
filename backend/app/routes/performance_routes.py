"""Performance Intelligence API routes."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.performance_service import (
    calculate_all_scores,
    calculate_user_score,
    get_employee_of_period,
    get_leaderboard,
    get_user_scores,
)

router = APIRouter(prefix="/performance", tags=["Performance Intelligence"])


def _current_period() -> tuple[str, str]:
    """Return current month label and quarter label."""
    now = datetime.now()
    month_label = now.strftime("%b-%Y")
    quarter = f"Q{(now.month - 1) // 3 + 1}-{now.year}"
    return month_label, quarter


@router.get("/my-score")
async def my_score(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's performance scores across all periods."""
    scores = await get_user_scores(db, current_user.id)

    # If no scores exist yet, calculate current period
    if not scores:
        month_label, quarter = _current_period()
        await calculate_user_score(db, current_user.id, "monthly", month_label)
        await calculate_user_score(db, current_user.id, "quarterly", quarter)
        await calculate_user_score(db, current_user.id, "yearly", str(datetime.now().year))
        scores = await get_user_scores(db, current_user.id)

    return [
        {
            "period_type": s.period_type,
            "period_label": s.period_label,
            "milestone_completion_rate": s.milestone_completion_rate,
            "consistency_score": s.consistency_score,
            "productivity_score": s.productivity_score,
            "update_frequency": s.update_frequency,
            "planned_vs_actual": s.planned_vs_actual,
            "progress_growth": s.progress_growth,
            "overall_score": s.overall_score,
            "rank": s.rank,
        }
        for s in scores
    ]


@router.get("/leaderboard")
async def leaderboard(
    period: str = "monthly",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get ranked leaderboard."""
    month_label, quarter = _current_period()
    period_label = month_label if period == "monthly" else (quarter if period == "quarterly" else str(datetime.now().year))

    board = await get_leaderboard(db, period, period_label)

    # Auto-calculate if empty
    if not board:
        board = await calculate_all_scores(db, period, period_label)

    return board


@router.get("/team-scores")
async def team_scores(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manager: get team performance scores."""
    from sqlalchemy import select
    from app.models.user import User as UserModel

    team_result = await db.execute(
        select(UserModel).where(UserModel.manager_id == current_user.id)
    )
    team = list(team_result.scalars().all())

    month_label, quarter = _current_period()
    team_data = []
    for member in team:
        score = await calculate_user_score(db, member.id, "monthly", month_label)
        team_data.append({
            "user_id": member.id,
            "name": member.name,
            "department": member.department,
            "overall_score": score.overall_score,
            "productivity_score": score.productivity_score,
            "consistency_score": score.consistency_score,
        })

    team_data.sort(key=lambda x: x["overall_score"], reverse=True)
    return team_data


@router.get("/employee-of/{period}")
async def employee_of(
    period: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get top performer for a given period type."""
    month_label, quarter = _current_period()
    label = month_label if period == "monthly" else (quarter if period == "quarterly" else str(datetime.now().year))

    result = await get_employee_of_period(db, period, label)
    if not result:
        # Trigger calculation
        await calculate_all_scores(db, period, label)
        result = await get_employee_of_period(db, period, label)

    return result or {"message": "No data available for this period"}


@router.post("/calculate")
async def trigger_calculation(
    period: str = "monthly",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Admin: trigger score calculation for all users."""
    month_label, quarter = _current_period()
    label = month_label if period == "monthly" else (quarter if period == "quarterly" else str(datetime.now().year))
    board = await calculate_all_scores(db, period, label)
    return {"message": f"Calculated {len(board)} scores", "leaderboard": board}
