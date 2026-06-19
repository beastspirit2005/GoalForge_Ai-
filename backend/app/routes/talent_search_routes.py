"""Talent Search Routes — search employees by skills."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.services.talent_searcher import search_talent

router = APIRouter(prefix="/talent", tags=["Talent Search"])


@router.get("/search")
async def talent_search(
    skills: str = Query(..., description="Comma-separated skill names"),
    min_proficiency: float = Query(default=0, description="Minimum proficiency filter"),
    department: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin", "hr", "department_head", "manager")),
):
    """Search employees by skills with dynamic ranking."""
    skill_list = [s.strip() for s in skills.split(",") if s.strip()]
    return await search_talent(db, skill_list, min_proficiency=min_proficiency, department=department)
