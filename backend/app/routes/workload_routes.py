from __future__ import annotations
"""Workload Routes — heatmaps, rebalancing, performance trends."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.ai.workload_scanner import build_workload_heatmap, suggest_rebalancing
from app.services.performance_analyzer import compute_performance_trend, get_productivity_insights

router = APIRouter(prefix="/workload", tags=["Workload Intelligence"])


@router.get("/heatmap")
async def workload_heatmap(
    department: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin", "department_head")),
):
    """Get workload heatmap for team members."""
    manager_id = current_user.id if current_user.role in ("manager", "team_lead") else None
    return await build_workload_heatmap(db, department=department, manager_id=manager_id)


@router.get("/rebalance-suggestions")
async def rebalance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Get AI workload rebalancing suggestions."""
    manager_id = current_user.id if current_user.role in ("manager", "team_lead") else None
    return await suggest_rebalancing(db, manager_id=manager_id)


@router.get("/trend/{user_id}")
async def performance_trend(
    user_id: int,
    period: int = Query(default=90, description="Period in days"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Get performance trend for a user."""
    return await compute_performance_trend(db, user_id, period_days=period)


@router.get("/productivity-insights")
async def productivity_insights(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Get team productivity insights."""
    manager_id = current_user.id if current_user.role in ("manager", "team_lead") else None
    return await get_productivity_insights(db, manager_id=manager_id)
