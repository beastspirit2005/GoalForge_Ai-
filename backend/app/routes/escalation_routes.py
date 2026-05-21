"""Escalation API routes."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.services.audit_service import log_action
from app.services.escalation_service import (
    acknowledge_escalation,
    check_and_escalate,
    get_escalations,
    resolve_escalation,
    update_escalation,
)

router = APIRouter(prefix="/escalations", tags=["Escalations"])


class ResolveRequest(BaseModel):
    note: str = ""


class EscalationUpdateRequest(BaseModel):
    status: str | None = None
    admin_remarks: str | None = None
    resolution_note: str | None = None


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
    
    await log_action(
        db, user_id=current_user.id, action="escalation_resolved",
        entity_type="escalation", entity_id=escalation_id,
        new_value={"status": "resolved", "note": data.note},
    )
    return result


@router.put("/{escalation_id}")
async def update_escalation_endpoint(
    escalation_id: int,
    data: EscalationUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Admin: Update an escalation with remarks, status, etc."""
    result = await update_escalation(
        db, 
        escalation_id, 
        status=data.status, 
        admin_remarks=data.admin_remarks, 
        resolution_note=data.resolution_note
    )
    if not result:
        raise HTTPException(status_code=404, detail="Escalation not found")
        
    await log_action(
        db, user_id=current_user.id, action="escalation_updated",
        entity_type="escalation", entity_id=escalation_id,
        new_value=data.model_dump(exclude_unset=True),
    )
    return result
