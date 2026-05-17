"""Milestone CRUD service."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.milestone import Milestone
from app.schemas.goal_schema import MilestoneCreate


async def create_milestone(db: AsyncSession, goal_id: int, data: MilestoneCreate) -> Milestone:
    milestone = Milestone(
        goal_id=goal_id,
        title=data.title,
        due_date=data.due_date,
        source=data.source,
    )
    db.add(milestone)
    await db.flush()
    await db.refresh(milestone)
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
    return milestones


async def get_goal_milestones(db: AsyncSession, goal_id: int) -> list[Milestone]:
    result = await db.execute(
        select(Milestone).where(Milestone.goal_id == goal_id).order_by(Milestone.created_at)
    )
    return list(result.scalars().all())


async def toggle_milestone(db: AsyncSession, milestone: Milestone) -> Milestone:
    milestone.is_completed = not milestone.is_completed
    await db.flush()
    await db.refresh(milestone)
    return milestone


async def delete_milestone(db: AsyncSession, milestone: Milestone) -> None:
    await db.delete(milestone)
    await db.flush()


async def get_milestone_by_id(db: AsyncSession, milestone_id: int) -> Milestone | None:
    result = await db.execute(select(Milestone).where(Milestone.id == milestone_id))
    return result.scalar_one_or_none()
