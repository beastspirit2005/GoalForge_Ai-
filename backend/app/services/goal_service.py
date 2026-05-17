"""Goal CRUD + approval workflow service."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.logic.scoring_logic import score_risk
from app.logic.validation_logic import validate_goal_count, validate_weightage
from app.models.goal import Goal
from app.models.role import GoalStatus
from app.models.user import User
from app.schemas.goal_schema import GoalCreate, GoalUpdate


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

    goal = Goal(
        user_id=user.id,
        title=data.title,
        description=data.description,
        target=data.target,
        uom=data.uom,
        weightage=data.weightage,
        deadline=data.deadline,
        status=GoalStatus.DRAFT.value,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


async def get_user_goals(db: AsyncSession, user_id: int) -> list[Goal]:
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.milestones))
        .where(Goal.user_id == user_id)
        .order_by(Goal.created_at.desc())
    )
    return list(result.scalars().all())


async def get_goal_by_id(db: AsyncSession, goal_id: int) -> Goal | None:
    result = await db.execute(
        select(Goal).options(selectinload(Goal.milestones)).where(Goal.id == goal_id)
    )
    return result.scalar_one_or_none()


async def update_goal(db: AsyncSession, goal: Goal, data: GoalUpdate, user: User) -> Goal:
    if data.weightage is not None and data.weightage != goal.weightage:
        _, total_w = await _user_goal_stats(db, goal.user_id)
        validate_weightage(data.weightage, total_w, exclude_weightage=goal.weightage)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)

    await db.flush()
    await db.refresh(goal)
    return goal


async def delete_goal(db: AsyncSession, goal: Goal) -> None:
    await db.delete(goal)
    await db.flush()


async def submit_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.PENDING.value
    await db.flush()
    await db.refresh(goal)
    return goal


async def approve_goal(db: AsyncSession, goal: Goal, **overrides) -> Goal:
    if "weightage" in overrides and overrides["weightage"] is not None:
        goal.weightage = overrides["weightage"]
    if "target" in overrides and overrides["target"] is not None:
        goal.target = overrides["target"]
    goal.status = GoalStatus.APPROVED.value
    await db.flush()
    await db.refresh(goal)
    return goal


async def reject_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.REJECTED.value
    await db.flush()
    await db.refresh(goal)
    return goal


async def lock_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.LOCKED.value
    await db.flush()
    await db.refresh(goal)
    return goal


async def unlock_goal(db: AsyncSession, goal: Goal) -> Goal:
    goal.status = GoalStatus.APPROVED.value
    await db.flush()
    await db.refresh(goal)
    return goal


async def get_team_goals(db: AsyncSession, manager_id: int) -> list[Goal]:
    """Fetch goals for all employees managed by a manager."""
    result = await db.execute(
        select(Goal)
        .join(User, Goal.user_id == User.id)
        .options(selectinload(Goal.milestones))
        .where(User.manager_id == manager_id)
        .order_by(Goal.created_at.desc())
    )
    return list(result.scalars().all())


async def get_all_goals(db: AsyncSession) -> list[Goal]:
    """Admin: fetch all goals across the organization."""
    result = await db.execute(
        select(Goal)
        .options(selectinload(Goal.milestones))
        .order_by(Goal.created_at.desc())
    )
    return list(result.scalars().all())


async def recalculate_risk(db: AsyncSession, goal: Goal, goal_count: int) -> Goal:
    """Recalculate and persist the risk score for a goal."""
    goal.risk = score_risk(goal.progress, goal.deadline, goal_count)
    await db.flush()
    await db.refresh(goal)
    return goal


async def get_team_goals(db: AsyncSession, manager_id: int) -> list[Goal]:
    """Get all goals for team members managed by a specific manager."""
    from app.models.user import User

    team_result = await db.execute(
        select(User.id).where(User.manager_id == manager_id)
    )
    team_ids = [row[0] for row in team_result.all()]

    if not team_ids:
        return []

    result = await db.execute(
        select(Goal).where(Goal.user_id.in_(team_ids))
    )
    return list(result.scalars().all())

