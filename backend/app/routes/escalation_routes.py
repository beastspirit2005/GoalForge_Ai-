"""Escalation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.services.escalation_service import (
    acknowledge_escalation,
    check_and_escalate,
    get_escalations,
    resolve_escalation,
)

router = APIRouter(prefix="/escalations", tags=["Escalations"])


class ResolveRequest(BaseModel):
    note: str = ""


@router.get("/")
async def list_escalations(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    """Get all escalations."""
    return await get_escalations(db, status)


@router.post("/scan")
async def scan_escalations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Admin: scan and auto-escalate at-risk goals."""
    new_escalations = await check_and_escalate(db)
    return {
        "escalated": len(new_escalations),
        "items": new_escalations,
    }


@router.post("/{escalation_id}/acknowledge")
async def acknowledge(
    escalation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    """Acknowledge an escalation."""
    result = await acknowledge_escalation(db, escalation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return result


@router.post("/{escalation_id}/resolve")
async def resolve(
    escalation_id: int,
    data: ResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    """Resolve an escalation."""
    result = await resolve_escalation(db, escalation_id, data.note)
    if not result:
        raise HTTPException(status_code=404, detail="Escalation not found")
    return result
