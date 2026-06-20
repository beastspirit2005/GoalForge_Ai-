from __future__ import annotations
"""AI Recommendation Routes — manager/employee matching and team formation."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.ai.manager_matcher import recommend_managers_for_target
from app.ai.employee_matcher import recommend_employees_for_task
from app.ai.team_formation import suggest_team_for_target

router = APIRouter(prefix="/ai-recommend", tags=["AI Recommendations"])


@router.get("/manager/{target_id}")
async def suggest_manager(
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin", "department_head")),
):
    """AI-powered manager recommendation for a target."""
    return await recommend_managers_for_target(db, target_id)


@router.get("/employee/{task_id}")
async def suggest_employee(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """AI-powered employee recommendation for a task."""
    return await recommend_employees_for_task(db, task_id)


@router.get("/team/{target_id}")
async def suggest_team(
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin", "department_head", "manager")),
):
    """AI-powered team formation for a target."""
    return await suggest_team_for_target(db, target_id)
