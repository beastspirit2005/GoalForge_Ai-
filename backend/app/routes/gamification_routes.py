from __future__ import annotations
"""Gamification Routes — leaderboards and point transaction ledgers."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.services.gamification_service import (
    get_global_leaderboard,
    get_team_leaderboard,
    get_user_transactions,
)
from app.services.work_points import get_user_points

router = APIRouter(prefix="/gamification", tags=["Gamification"])


@router.get("/leaderboard")
async def global_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get global employee leaderboard by work points."""
    return await get_global_leaderboard(db)


@router.get("/team-leaderboard")
async def team_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get team leaderboard for current user's manager."""
    manager_id = current_user.manager_id or current_user.id
    return await get_team_leaderboard(db, manager_id)


@router.get("/my-points")
async def my_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's work points and blockchain balance."""
    return await get_user_points(db, current_user.id)


@router.get("/my-transactions")
async def my_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's point transaction history."""
    return await get_user_transactions(db, current_user.id)
