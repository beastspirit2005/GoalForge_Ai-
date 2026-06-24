"""Progress Cascade Service — propagates progress from Goals → Tasks → Targets."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.models.goal import Goal
from app.models.target import Target, Task
from app.models.milestone import Milestone


async def cascade_goal_progress(db: AsyncSession, goal_id: int):
    """Recalculate a goal's progress from milestones, then cascade up to Task → Target."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        return

    # Recalculate goal progress from milestones
    ms_result = await db.execute(select(Milestone).where(Milestone.goal_id == goal_id))
    milestones = list(ms_result.scalars().all())

    if milestones:
        completed = sum(1 for m in milestones if m.is_completed)
        goal.progress = round((completed / len(milestones)) * 100, 1)

        # Auto-complete goal if all milestones done
        if completed == len(milestones) and goal.status not in ("completed", "archived"):
            goal.status = "completed"
        elif completed < len(milestones) and goal.status == "completed":
            goal.status = "approved"

    await db.flush()

    # Cascade up to Task if goal belongs to one
    if goal.task_id:
        await cascade_task_progress(db, goal.task_id)


async def cascade_task_progress(db: AsyncSession, task_id: int):
    """Recalculate a task's progress from its goals, then cascade up to Target."""
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        return

    # Compute task progress as average of its goals
    goals_result = await db.execute(select(Goal).where(Goal.task_id == task_id))
    goals = list(goals_result.scalars().all())

    if goals:
        task.progress = round(sum(g.progress for g in goals) / len(goals), 1)

        # Update task status based on progress
        if task.progress >= 100:
            task.status = "completed"
        elif task.progress > 0 and task.status in ("pending",):
            task.status = "active"

    await db.flush()

    # Cascade up to Target
    if task.target_id:
        await cascade_target_progress(db, task.target_id)


async def cascade_target_progress(db: AsyncSession, target_id: int):
    """Recalculate a target's progress from its tasks."""
    target_result = await db.execute(select(Target).where(Target.id == target_id))
    target = target_result.scalar_one_or_none()
    if not target:
        return

    tasks_result = await db.execute(select(Task).where(Task.target_id == target_id))
    tasks = list(tasks_result.scalars().all())

    if tasks:
        target.progress = round(sum(t.progress for t in tasks) / len(tasks), 1)

        # Update target status
        if target.progress >= 100:
            target.status = "completed"

    await db.flush()
