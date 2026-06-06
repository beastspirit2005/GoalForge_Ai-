from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.goal_schema import (
    GoalApprovalRequest,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    MilestoneCreate,
    MilestoneResponse,
)
from app.services.audit_service import log_action
from app.services.goal_service import (
    create_goal,
    delete_goal,
    get_goal_by_id,
    get_user_goals,
    submit_goal,
    update_goal,
)
from app.services.milestone_service import (
    create_milestone,
    get_goal_milestones,
    get_milestone_by_id,
    toggle_milestone,
)
from app.services.ai_service import generate_and_store_plan
from datetime import datetime

router = APIRouter(prefix="/goals", tags=["Goals"])


def _goal_to_response(goal, owner_name: str | None = None, department: str | None = None) -> dict:
    return {
        "id": goal.id,
        "user_id": goal.user_id,
        "title": goal.title,
        "description": goal.description,
        "target": goal.target,
        "uom": goal.uom,
        "weightage": goal.weightage,
        "deadline": goal.deadline,
        "status": goal.status,
        "progress": goal.progress,
        "risk": goal.risk,
        "is_shared": goal.is_shared,
        "ai_recommendation": goal.ai_recommendation,
        "created_at": str(goal.created_at) if goal.created_at else None,
        "updated_at": str(goal.updated_at) if goal.updated_at else None,
        "owner_name": owner_name,
        "department": department,
        "milestones": [
            {
                "id": m.id,
                "goal_id": m.goal_id,
                "title": m.title,
                "due_date": m.due_date,
                "is_completed": m.is_completed,
                "source": m.source,
            }
            for m in (goal.milestones or [])
        ],
        "escalations": [
            {
                "id": e.id,
                "goal_id": e.goal_id,
                "reason": e.reason,
                "severity": e.severity,
                "status": e.status,
                "admin_remarks": e.admin_remarks,
                "resolution_note": e.resolution_note,
                "created_at": str(e.created_at) if e.created_at else None,
                "resolved_at": str(e.resolved_at) if e.resolved_at else None,
            }
            for e in (goal.escalations or [])
        ] if hasattr(goal, "escalations") and goal.escalations else [],
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create(
    data: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await create_goal(db, current_user, data)
    await log_action(db, user_id=current_user.id, action="goal_created", entity_type="goal", entity_id=goal.id)
    # Eagerly load relationships to avoid lazy loading issues
    goal = await get_goal_by_id(db, goal.id)
    return _goal_to_response(goal, current_user.name, current_user.department)


@router.get("/")
async def list_goals(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = await get_user_goals(db, current_user.id, skip, limit)
    return [_goal_to_response(g, current_user.name, current_user.department) for g in goals]


@router.get("/prioritized")
async def prioritized_goals(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Smart Prioritization Engine: Ranks goals based on deadline, risk, and weightage."""
    goals = await get_user_goals(db, current_user.id, skip, limit)
    active_goals = [g for g in goals if g.status not in ("completed", "archived")]
    
    def calculate_score(g):
        score = g.weightage
        
        # Risk factor
        if g.risk.lower() == "high":
            score += 20
        elif g.risk.lower() == "medium":
            score += 10
            
        # Deadline proximity factor
        if g.deadline:
            try:
                if isinstance(g.deadline, datetime):
                    dl_date = g.deadline
                else:
                    dl_date = datetime.strptime(str(g.deadline)[:10], "%Y-%m-%d")
                    
                if dl_date.tzinfo is not None:
                    dl_date = dl_date.replace(tzinfo=None)
                    
                days_left = (dl_date - datetime.now()).days
                if days_left < 0:
                    score += 30 # Overdue is critical
                elif days_left <= 7:
                    score += 15 # Due this week
                elif days_left <= 30:
                    score += 5 # Due this month
            except (ValueError, TypeError):
                pass
                
        return score
        
    ranked = sorted(active_goals, key=calculate_score, reverse=True)
    return [_goal_to_response(g, current_user.name, current_user.department) for g in ranked]


@router.get("/{goal_id}")
async def get_goal(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _goal_to_response(goal)


@router.put("/{goal_id}")
async def update(
    goal_id: int,
    data: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != current_user.id and current_user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    if goal.status == "locked":
        raise HTTPException(status_code=400, detail="Goal is locked")

    old_status = goal.status
    goal = await update_goal(db, goal, data, current_user)
    await log_action(
        db, user_id=current_user.id, action="goal_updated", entity_type="goal", entity_id=goal.id,
        old_value={"status": old_status}, new_value=data.model_dump(exclude_unset=True),
    )
    # Eagerly load relationships to avoid lazy loading issues
    goal = await get_goal_by_id(db, goal.id)
    return _goal_to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await log_action(db, user_id=current_user.id, action="goal_deleted", entity_type="goal", entity_id=goal.id)
    await delete_goal(db, goal)


@router.post("/{goal_id}/submit")
async def submit(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await submit_goal(db, goal)
    await log_action(db, user_id=current_user.id, action="goal_submitted", entity_type="goal", entity_id=goal.id)
    # Eagerly load relationships to avoid lazy loading issues
    goal = await get_goal_by_id(db, goal.id)
    return _goal_to_response(goal)


@router.post("/{goal_id}/generate-plan")
async def generate_plan(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    plan = await generate_and_store_plan(db, goal)
    return plan


# ── Milestones ──────────────────────────────────────────────
@router.get("/{goal_id}/milestones")
async def list_milestones(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != current_user.id and current_user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    milestones = await get_goal_milestones(db, goal_id)
    return [
        {"id": m.id, "goal_id": m.goal_id, "title": m.title, "due_date": m.due_date,
         "is_completed": m.is_completed, "source": m.source}
        for m in milestones
    ]


@router.post("/{goal_id}/milestones", status_code=status.HTTP_201_CREATED)
async def add_milestone(
    goal_id: int,
    data: MilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = await create_milestone(db, goal_id, data, current_user)
    return {"id": milestone.id, "goal_id": milestone.goal_id, "title": milestone.title,
            "due_date": milestone.due_date, "is_completed": milestone.is_completed, "source": milestone.source}


@router.patch("/milestones/{milestone_id}/toggle")
async def toggle(
    milestone_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = await get_milestone_by_id(db, milestone_id)
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    milestone = await toggle_milestone(db, milestone, current_user)
    return {"id": milestone.id, "is_completed": milestone.is_completed}
