"""Risk Prediction Routes — burnout detection, SLA scanning."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.ai.prediction_engine import predict_user_burnout
from app.services.escalation_engine_v2 import scan_sla_violations

router = APIRouter(prefix="/risk", tags=["Risk Prediction"])


@router.get("/burnout/{user_id}")
async def burnout_risk(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Get burnout risk assessment for a user."""
    return await predict_user_burnout(db, user_id)


@router.post("/scan-sla")
async def scan_sla(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "super_admin")),
):
    """Scan all goals/tasks for SLA violations and create escalations."""
    return await scan_sla_violations(db)
