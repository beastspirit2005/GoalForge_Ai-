"""Prediction API routes — completion, burnout, delayed goals, team outlook."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.ai.prediction_engine import (
    predict_goal_completion,
    predict_user_burnout,
    predict_delayed_goals,
    get_team_predictions,
)

router = APIRouter(prefix="/predictions", tags=["Predictive Analytics"])


@router.get("/goal/{goal_id}")
async def goal_prediction(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get completion probability and risk factors for a goal."""
    return await predict_goal_completion(db, goal_id)


@router.get("/burnout")
async def my_burnout(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get burnout risk assessment for current user."""
    return await predict_user_burnout(db, current_user.id)


@router.get("/burnout/{user_id}")
async def user_burnout(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    """Manager/Admin: get burnout risk for a specific user."""
    return await predict_user_burnout(db, user_id)


@router.get("/delayed-goals")
async def delayed_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of goals predicted to miss their deadlines."""
    role = current_user.role
    if role in ("manager", "admin"):
        return await predict_delayed_goals(db)  # All goals
    return await predict_delayed_goals(db, current_user.id)  # Own goals only


@router.get("/team-outlook")
async def team_outlook(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    """Manager: get team-level predictions."""
    return await get_team_predictions(db, current_user.id)
