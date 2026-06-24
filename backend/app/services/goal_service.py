"""Goal CRUD + approval workflow service."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.logic.scoring_logic import score_risk
from app.logic.validation_logic import validate_goal_count, validate_weightage
from app.models.goal import Goal
from app.models.role import GoalStatus
from app.models.user import User
from app.models.escalation import Escalation
from app.schemas.goal_schema import GoalCreate, GoalUpdate
from sqlalchemy import inspect as sa_inspect

async def refresh_columns_only(db: AsyncSession, instance):
    """Refresh only column attributes without expiring loaded relationships."""
    mapper = sa_inspect(type(instance))
    column_attrs = [c.key for c in mapper.column_attrs]
    await db.refresh(instance, attribute_names=column_attrs)



async def _user_goal_stats(db: AsyncSession, user_id: int) -> tuple[int, float]:
    """Return (goal_count, total_weightage) for a user."""
    result = await db.execute(
        select(func.count(), func.coalesce(func.sum(Goal.weightage), 0.0)).where(
            Goal.user_id == user_id
        )
    )
    row = result.one()
    return int(row[0]), float(row[1])


async def create_goal(db: AsyncSession, user: User, data: GoalCreate) -> Goal:
    count, total_w = await _user_goal_stats(db, user.id)
    validate_goal_count(count)
    validate_weightage(data.weightage, total_w)

    # Validate task assignment if creating goal under a task
    task_id = getattr(data, 'task_id', None)
    if task_id:
        from app.models.target import Task, TaskAssignee
        task_result = await db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()
        if not task:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Task not found")
        # Check if user is assigned to this task
        assignee_check = await db.execute(
            select(TaskAssignee).where(
                TaskAssignee.task_id == task_id,
                TaskAssignee.user_id == user.id
            )
        )
        is_legacy_assigned = task.assigned_to == user.id
        is_multi_assigned = assignee_check.scalar_one_or_none() is not None
        if not is_legacy_assigned and not is_multi_assigned and user.role not in ("manager", "admin", "super_admin"):
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="You are not assigned to this task")

    goal = Goal(
        user_id=user.id,
        title=data.title,
        description=data.description,
        target=data.target,
        uom=data.uom,
        weightage=data.weightage,
        deadline=data.deadline,
        task_id=getattr(data, 'task_id', None),
        status=GoalStatus.DRAFT.value,
    )
    db.add(goal)
    await db.flush()
    await refresh_columns_only(db, goal)
    
    if goal.task_id:
        from app.services.progress_cascade import cascade_task_progress
        await cascade_task_progress(db, goal.task_id)
        
    return goal


async def get_user_goals(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> list[Goal]:
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.milestones), selectinload(Goal.escalations))
        .where(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_goal_by_id(db: AsyncSession, goal_id: int) -> Goal | None:
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.milestones), selectinload(Goal.escalations))
        .where(Goal.id == goal_id)
    )
    return result.scalar_one_or_none()


async def update_goal(db: AsyncSession, goal: Goal, data: GoalUpdate, user: User) -> Goal:
    if data.weightage is not None and data.weightage != goal.weightage:
        _, total_w = await _user_goal_stats(db, goal.user_id)
        validate_weightage(data.weightage, total_w, exclude_weightage=goal.weightage)

    updated_fields = data.model_dump(exclude_unset=True)
    for field, value in updated_fields.items():
        setattr(goal, field, value)

    await db.flush()
    await refresh_columns_only(db, goal)

    # Cascade progress up if progress or status was changed and goal is linked to a task
    if goal.task_id and ("progress" in updated_fields or "status" in updated_fields):
        from app.services.progress_cascade import cascade_task_progress
        await cascade_task_progress(db, goal.task_id)

    return goal


async def delete_goal(db: AsyncSession, goal: Goal) -> None:
    task_id = goal.task_id
    await db.delete(goal)
    await db.flush()
    if task_id:
        from app.services.progress_cascade import cascade_task_progress
        await cascade_task_progress(db, task_id)


async def submit_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.PENDING.value
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal


async def approve_goal(db: AsyncSession, goal: Goal, **overrides) -> Goal:
    if "weightage" in overrides and overrides["weightage"] is not None:
        goal.weightage = overrides["weightage"]
    if "target" in overrides and overrides["target"] is not None:
        goal.target = overrides["target"]
    goal.status = GoalStatus.APPROVED.value
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal


async def reject_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.REJECTED.value
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal


async def lock_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.LOCKED.value
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal


async def unlock_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.APPROVED.value
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal



async def get_all_goals(db: AsyncSession, skip: int = 0, limit: int = 100, current_user: User | None = None) -> list[Goal]:
    """Admin: fetch all goals across the organization."""
    stmt = select(Goal).options(selectinload(Goal.milestones), selectinload(Goal.escalations))
    
    if current_user and current_user.role == "admin":
        from sqlalchemy import or_
        from app.models.user import User as UserModel
        
        # Subquery for users that belong to this admin
        allowed_users = select(UserModel.id).where(
            or_(
                UserModel.id == current_user.id,
                UserModel.admin_id == current_user.id,
                UserModel.manager_id.in_(
                    select(UserModel.id).where(UserModel.admin_id == current_user.id)
                )
            )
        )
        stmt = stmt.where(Goal.user_id.in_(allowed_users))
        
    result = await db.execute(
        stmt.order_by(Goal.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.scalars().all())


async def recalculate_risk(db: AsyncSession, goal: Goal, goal_count: int) -> Goal:
    """Recalculate and persist the risk score for a goal."""
    goal.risk = score_risk(goal.progress, goal.deadline, goal_count)
    await db.flush()
    await refresh_columns_only(db, goal)
    return goal


async def get_team_goals(db: AsyncSession, manager_id: int, skip: int = 0, limit: int = 100) -> list[Goal]:
    """Get all goals for team members managed by a specific manager."""
    from app.models.user import User

    team_result = await db.execute(
        select(User.id).where(User.manager_id == manager_id)
    )
    team_ids = [row[0] for row in team_result.all()]

    if not team_ids:
        return []

    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.milestones), selectinload(Goal.escalations))
        .where(Goal.user_id.in_(team_ids))
        .order_by(Goal.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())

