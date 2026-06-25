from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role, require_write_role
from app.core.database import get_db
from app.models.checkin import Checkin
from app.models.user import User
from app.schemas.goal_schema import GoalApprovalRequest
from app.services.audit_service import log_action
from app.services.goal_service import (
    approve_goal,
    get_goal_by_id,
    get_team_goals,
    lock_goal,
    reject_goal,
)
from app.services.notification_service import create_notification

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/team")
async def team_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    goals = await get_team_goals(db, current_user.id)
    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "title": g.title,
            "description": g.description,
            "target": g.target,
            "weightage": g.weightage,
            "deadline": g.deadline,
            "status": g.status,
            "progress": g.progress,
            "risk": g.risk,
            "milestones": [
                {"id": m.id, "title": m.title, "due_date": m.due_date, "is_completed": m.is_completed}
                for m in (g.milestones or [])
            ],
        }
        for g in goals
    ]


@router.post("/goals/{goal_id}/approve")
async def approve(
    goal_id: int,
    data: GoalApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.action == "approve":
        is_edited = (data.weightage is not None and data.weightage != goal.weightage) or \
                    (data.target is not None and data.target != goal.target)
        
        goal = await approve_goal(db, goal, weightage=data.weightage, target=data.target)
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if is_edited:
            msg = f"Your goal '{goal.title}' has been approved with edits by your manager on {timestamp}."
            action_type = "goal_approved_after_edit"
        else:
            msg = f"Your goal '{goal.title}' has been approved on {timestamp}."
            action_type = "goal_approved"
            
        await create_notification(
            db, user_id=goal.user_id, title="Goal Approved",
            message=msg, notif_type=action_type,
        )
    elif data.action == "reject":
        goal = await reject_goal(db, goal)
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await create_notification(
            db, user_id=goal.user_id, title="Goal Rejected",
            message=f"Your goal '{goal.title}' was rejected on {timestamp}. Comment: {data.comment or 'N/A'}",
            notif_type="goal_rejected",
        )
        action_type = "goal_rejected"

    await log_action(
        db, user_id=current_user.id, action=action_type,
        entity_type="goal", entity_id=goal.id,
    )
    return {"status": goal.status, "message": f"Goal {data.action}d successfully"}


@router.post("/goals/{goal_id}/lock")
async def lock(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await lock_goal(db, goal)
    await log_action(db, user_id=current_user.id, action="goal_locked", entity_type="goal", entity_id=goal.id)
    return {"status": goal.status}


@router.post("/checkins/{checkin_id}/comment")
async def add_comment(
    checkin_id: int,
    comment: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    result = await db.execute(select(Checkin).where(Checkin.id == checkin_id))
    checkin = result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    checkin.manager_comment = comment
    await db.flush()
    await db.refresh(checkin)
    return {"id": checkin.id, "manager_comment": checkin.manager_comment}


from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import require_role, require_write_role
from app.core.database import get_db
from app.models.checkin import Checkin
from app.models.user import User
from app.schemas.goal_schema import GoalApprovalRequest
from app.services.audit_service import log_action
from app.services.goal_service import (
    approve_goal,
    get_goal_by_id,
    get_team_goals,
    lock_goal,
    reject_goal,
)
from app.services.notification_service import create_notification

router = APIRouter(prefix="/manager", tags=["Manager"])


@router.get("/team")
async def team_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "admin")),
):
    goals = await get_team_goals(db, current_user.id)
    return [
        {
            "id": g.id,
            "user_id": g.user_id,
            "title": g.title,
            "description": g.description,
            "target": g.target,
            "weightage": g.weightage,
            "deadline": g.deadline,
            "status": g.status,
            "progress": g.progress,
            "risk": g.risk,
            "milestones": [
                {"id": m.id, "title": m.title, "due_date": m.due_date, "is_completed": m.is_completed}
                for m in (g.milestones or [])
            ],
        }
        for g in goals
    ]


@router.post("/goals/{goal_id}/approve")
async def approve(
    goal_id: int,
    data: GoalApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if data.action == "approve":
        is_edited = (data.weightage is not None and data.weightage != goal.weightage) or \
                    (data.target is not None and data.target != goal.target)
        
        goal = await approve_goal(db, goal, weightage=data.weightage, target=data.target)
        
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if is_edited:
            msg = f"Your goal '{goal.title}' has been approved with edits by your manager on {timestamp}."
            action_type = "goal_approved_after_edit"
        else:
            msg = f"Your goal '{goal.title}' has been approved on {timestamp}."
            action_type = "goal_approved"
            
        await create_notification(
            db, user_id=goal.user_id, title="Goal Approved",
            message=msg, notif_type=action_type,
        )
    elif data.action == "reject":
        goal = await reject_goal(db, goal)
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        await create_notification(
            db, user_id=goal.user_id, title="Goal Rejected",
            message=f"Your goal '{goal.title}' was rejected on {timestamp}. Comment: {data.comment or 'N/A'}",
            notif_type="goal_rejected",
        )
        action_type = "goal_rejected"

    await log_action(
        db, user_id=current_user.id, action=action_type,
        entity_type="goal", entity_id=goal.id,
    )
    return {"status": goal.status, "message": f"Goal {data.action}d successfully"}


@router.post("/goals/{goal_id}/lock")
async def lock(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await lock_goal(db, goal)
    await log_action(db, user_id=current_user.id, action="goal_locked", entity_type="goal", entity_id=goal.id)
    return {"status": goal.status}


@router.post("/checkins/{checkin_id}/comment")
async def add_comment(
    checkin_id: int,
    comment: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin")),
):
    result = await db.execute(select(Checkin).where(Checkin.id == checkin_id))
    checkin = result.scalar_one_or_none()
    if not checkin:
        raise HTTPException(status_code=404, detail="Check-in not found")
    checkin.manager_comment = comment
    await db.flush()
    await db.refresh(checkin)
    return {"id": checkin.id, "manager_comment": checkin.manager_comment}


@router.get("/team-members")
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_write_role("manager", "admin", "super_admin")),
):
    """Get all active employees managed by the current manager."""
    from sqlalchemy import select, or_
    from app.models.user import User as UserModel
    result = await db.execute(
        select(UserModel).where(
            or_(
                UserModel.manager_id == current_user.id,
                UserModel.admin_id == current_user.id
            ),
            UserModel.is_active == True
        )
    )
    members = result.scalars().all()
    return [
        {"id": m.id, "name": m.name, "email": m.email, "role": m.role, "department": m.department}
        for m in members
    ]
