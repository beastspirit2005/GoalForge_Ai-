from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.checkin import Checkin
from app.models.user import User
from app.schemas.checkin_schema import CheckinCreate, CheckinResponse, CheckinUpdate

router = APIRouter(prefix="/checkins", tags=["Check-ins"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_checkin(
    data: CheckinCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = Checkin(
        goal_id=data.goal_id,
        user_id=current_user.id,
        quarter=data.quarter,
        actual_achievement=data.actual_achievement,
        progress_status=data.progress_status,
        notes=data.notes,
    )
    db.add(checkin)
    await db.flush()
    await db.refresh(checkin)
    return _to_response(checkin)


@router.get("/")
async def list_checkins(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Checkin)
        .where(Checkin.user_id == current_user.id)
        .order_by(Checkin.created_at.desc())
    )
    return [_to_response(c) for c in result.scalars().all()]


@router.get("/{checkin_id}")
async def get_checkin(
    checkin_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = await _get_or_404(db, checkin_id)
    return _to_response(checkin)


@router.put("/{checkin_id}")
async def update_checkin(
    checkin_id: int,
    data: CheckinUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    checkin = await _get_or_404(db, checkin_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        # Only managers can add manager_comment
        if field == "manager_comment" and current_user.role not in ("manager", "admin"):
            continue
        setattr(checkin, field, value)

    await db.flush()
    await db.refresh(checkin)
    return _to_response(checkin)


async def _get_or_404(db: AsyncSession, checkin_id: int) -> Checkin:
    result = await db.execute(select(Checkin).where(Checkin.id == checkin_id))
    checkin = result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    return checkin


def _to_response(checkin: Checkin) -> dict:
    return {
        "id": checkin.id,
        "goal_id": checkin.goal_id,
        "user_id": checkin.user_id,
        "quarter": checkin.quarter,
        "actual_achievement": checkin.actual_achievement,
        "progress_status": checkin.progress_status,
        "notes": checkin.notes,
        "manager_comment": checkin.manager_comment,
        "created_at": str(checkin.created_at) if checkin.created_at else None,
    }
