from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth_schema import UserResponse, UserUpdate, RegisterRequest
from app.services.audit_service import get_audit_logs, log_action
from app.services.auth_service import get_all_users, update_user, register_user
from app.services.goal_service import get_all_goals, get_goal_by_id, unlock_goal

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    users = await get_all_users(db)
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "department": u.department,
            "manager_id": u.manager_id,
            "is_active": u.is_active,
        }
        for u in users
    ]


@router.post("/register")
async def register_admin_user(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = await register_user(db, data)
    await log_action(
        db, user_id=current_user.id, action="user_created",
        entity_type="user", entity_id=user.id,
        new_value={"name": user.name, "email": user.email, "role": user.role},
    )
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
    }


@router.put("/users/{user_id}")
async def edit_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user = await update_user(db, user, **data.model_dump(exclude_unset=True))
    await log_action(
        db, user_id=current_user.id, action="user_updated",
        entity_type="user", entity_id=user.id,
        new_value=data.model_dump(exclude_unset=True),
    )
    return {"id": user.id, "name": user.name, "role": user.role, "is_active": user.is_active}


@router.post("/goals/{goal_id}/unlock")
async def admin_unlock(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await unlock_goal(db, goal)
    await log_action(
        db, user_id=current_user.id, action="goal_unlocked",
        entity_type="goal", entity_id=goal.id,
    )
    return {"status": goal.status, "message": "Goal unlocked"}


@router.get("/goals")
async def all_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    goals = await get_all_goals(db)
    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "title": g.title,
            "status": g.status,
            "progress": g.progress,
            "risk": g.risk,
            "weightage": g.weightage,
            "deadline": g.deadline,
        }
        for g in goals
    ]


@router.get("/audit-logs")
async def audit_logs(
    entity_type: str | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    logs = await get_audit_logs(db, limit=limit, entity_type=entity_type)
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "old_value": l.old_value,
            "new_value": l.new_value,
            "created_at": str(l.created_at) if l.created_at else None,
        }
        for l in logs
    ]
