from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth_schema import UserResponse, UserUpdate, RegisterRequest, AdminUserUpdate
from app.services.audit_service import get_audit_logs, log_action
from app.services.auth_service import get_all_users, update_user, register_user
from app.services.goal_service import get_all_goals, get_goal_by_id, unlock_goal

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    users = await get_all_users(db, skip, limit)
    # Filter out soft-deleted users so they disappear from the UI after deletion
    users = [u for u in users if u.is_active]
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "department": u.department,
            "manager_id": u.manager_id,
            "is_active": u.is_active,
            "is_approved": u.is_approved,
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
    data: AdminUserUpdate,
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


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    print("APPROVE_USER ROUTE HIT!")
    try:
        from sqlalchemy import select
        from app.services.email_service import EmailDeliveryError, send_approval_email
        import asyncio
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_approved = True
        await db.flush()
        await db.refresh(user)
        
        await log_action(
            db, user_id=current_user.id, action="user_approved",
            entity_type="user", entity_id=user.id,
        )
        
        def send_approval_email_safely():
            try:
                send_approval_email(user.email, user.name, user.role)
            except EmailDeliveryError as exc:
                print(f"Approval email was not sent for user {user.id}: {exc}")

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, send_approval_email_safely)

        return {"id": user.id, "is_approved": user.is_approved, "message": "User approved successfully"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    from sqlalchemy import select
    from sqlalchemy.exc import IntegrityError
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    try:
        await db.delete(user)
        await db.flush()
    except IntegrityError:
        await db.rollback()
        # Fallback to soft delete if there are foreign key constraints
        user.is_active = False
        await db.flush()
        
    await log_action(
        db, user_id=current_user.id, action="user_deleted",
        entity_type="user", entity_id=user_id,
    )
    return {"message": "User deleted successfully"}


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
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    goals = await get_all_goals(db, skip, limit)
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
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    logs = await get_audit_logs(db, skip=skip, limit=limit, entity_type=entity_type)
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
