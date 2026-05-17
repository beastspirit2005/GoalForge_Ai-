"""Recognition API routes — badges, streaks, trophies."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.recognition_service import (
    check_and_award_badges,
    get_user_badges,
    get_user_streaks,
    update_streak,
)

router = APIRouter(prefix="/recognition", tags=["Recognition"])


@router.get("/badges")
async def my_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's badges."""
    return await get_user_badges(db, current_user.id)


@router.get("/badges/{user_id}")
async def user_badges(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get badges for a specific user."""
    return await get_user_badges(db, user_id)


@router.post("/check-badges")
async def check_badges(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check and award any newly earned badges."""
    new_badges = await check_and_award_badges(db, current_user.id)
    return {
        "new_badges": new_badges,
        "message": f"{len(new_badges)} new badge(s) earned!" if new_badges else "No new badges earned.",
    }


@router.get("/streaks")
async def my_streaks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's streaks."""
    return await get_user_streaks(db, current_user.id)


@router.post("/streaks/update")
async def trigger_streak_update(
    streak_type: str = "daily_update",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a streak (called after user performs an activity)."""
    return await update_streak(db, current_user.id, streak_type)
