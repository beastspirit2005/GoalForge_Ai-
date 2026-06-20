from __future__ import annotations
"""Capacity Planning Routes — demand vs capacity forecasting."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.services.capacity_planner import compute_capacity_forecast
from app.services.succession_engine import detect_knowledge_risks

router = APIRouter(prefix="/capacity", tags=["Capacity Planning"])


@router.get("/forecast")
async def capacity_forecast(
    department: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin", "super_admin", "department_head")),
):
    """Get capacity vs demand forecast."""
    manager_id = current_user.id if current_user.role == "manager" else None
    return await compute_capacity_forecast(db, department=department, manager_id=manager_id)


@router.get("/succession-risk")
async def succession_risk(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin", "department_head", "hr")),
):
    """Detect single points of failure in skill coverage."""
    return await detect_knowledge_risks(db)
