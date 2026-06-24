"""Milestone CRUD service."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.models.user import User
from app.schemas.goal_schema import MilestoneCreate


async def create_milestone(db: AsyncSession, goal_id: int, data: MilestoneCreate, current_user: User) -> Milestone:
    from app.services.goal_service import get_goal_by_id
    from fastapi import HTTPException
    
    goal = await get_goal_by_id(db, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != current_user.id and current_user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    milestone = Milestone(
        goal_id=goal_id,
        title=data.title,
        due_date=data.due_date,
        source=data.source,
    )
    db.add(milestone)
    await db.flush()
    await db.refresh(milestone)
    from app.services.progress_cascade import cascade_goal_progress
    await cascade_goal_progress(db, goal_id)
    return milestone


async def bulk_create_milestones(
    db: AsyncSession, goal_id: int, titles: list[str], source: str = "ai"
) -> list[Milestone]:
    """Create multiple milestones at once (used by AI plan generation)."""
    milestones = []
    for i, title in enumerate(titles):
        m = Milestone(
            goal_id=goal_id,
            title=title,
            due_date=f"Week {i + 1}",
            source=source,
        )
        db.add(m)
        milestones.append(m)
    await db.flush()
    for m in milestones:
        await db.refresh(m)
    from app.services.progress_cascade import cascade_goal_progress
    await cascade_goal_progress(db, goal_id)
    return milestones


async def get_goal_milestones(db: AsyncSession, goal_id: int) -> list[Milestone]:
    result = await db.execute(
        select(Milestone).where(Milestone.goal_id == goal_id).order_by(Milestone.created_at)
    )
    return list(result.scalars().all())


async def toggle_milestone(db: AsyncSession, milestone: Milestone, current_user: User) -> Milestone:
    from app.services.goal_service import get_goal_by_id
    from fastapi import HTTPException
    
    goal = await get_goal_by_id(db, milestone.goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if goal.user_id != current_user.id and current_user.role not in ("manager", "admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    milestone.is_completed = not milestone.is_completed
    await db.flush()
    await db.refresh(milestone)
    from app.services.progress_cascade import cascade_goal_progress
    await cascade_goal_progress(db, milestone.goal_id)
    return milestone


async def delete_milestone(db: AsyncSession, milestone: Milestone) -> None:
    goal_id = milestone.goal_id
    await db.delete(milestone)
    await db.flush()
    from app.services.progress_cascade import cascade_goal_progress
    await cascade_goal_progress(db, goal_id)


async def get_milestone_by_id(db: AsyncSession, milestone_id: int) -> Milestone | None:
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    return result.scalar_one_or_none()
