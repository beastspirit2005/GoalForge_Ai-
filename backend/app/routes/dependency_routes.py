"""Dependency Management Routes — task dependencies and impact analysis."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.models.target import Task, TaskDependency, Target

router = APIRouter(prefix="/dependencies", tags=["Dependency Management"])


@router.get("/task/{task_id}")
async def get_task_dependencies(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all dependencies for a task."""
    # Upstream (tasks this task depends on)
    upstream_result = await db.execute(
        select(TaskDependency.depends_on_id).where(TaskDependency.task_id == task_id)
    )
    upstream_ids = [row[0] for row in upstream_result.all()]

    # Downstream (tasks that depend on this task)
    downstream_result = await db.execute(
        select(TaskDependency.task_id).where(TaskDependency.depends_on_id == task_id)
    )
    downstream_ids = [row[0] for row in downstream_result.all()]

    # Fetch task details
    upstream_tasks = []
    for uid in upstream_ids:
        t_result = await db.execute(select(Task).where(Task.id == uid))
        t = t_result.scalar_one_or_none()
        if t:
            upstream_tasks.append({"id": t.id, "title": t.title, "status": t.status, "progress": t.progress})

    downstream_tasks = []
    for did in downstream_ids:
        t_result = await db.execute(select(Task).where(Task.id == did))
        t = t_result.scalar_one_or_none()
        if t:
            downstream_tasks.append({"id": t.id, "title": t.title, "status": t.status, "progress": t.progress})

    return {
        "task_id": task_id,
        "upstream_dependencies": upstream_tasks,
        "downstream_dependents": downstream_tasks,
    }


@router.post("/add")
async def add_dependency(
    task_id: int,
    depends_on_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Add a dependency between tasks."""
    if task_id == depends_on_id:
        raise HTTPException(status_code=400, detail="A task cannot depend on itself")

    # Check both tasks exist
    for tid in (task_id, depends_on_id):
        result = await db.execute(select(Task).where(Task.id == tid))
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail=f"Task {tid} not found")

    # Check for existing
    existing = await db.execute(
        select(TaskDependency).where(
            TaskDependency.task_id == task_id,
            TaskDependency.depends_on_id == depends_on_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Dependency already exists")

    dep = TaskDependency(task_id=task_id, depends_on_id=depends_on_id)
    db.add(dep)
    await db.flush()

    return {"task_id": task_id, "depends_on_id": depends_on_id, "status": "created"}


@router.get("/impact-analysis/{task_id}")
async def impact_analysis(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("manager", "team_lead", "admin", "super_admin")),
):
    """Analyze downstream impact if a task is delayed."""
    # Get source task
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    source_task = task_result.scalar_one_or_none()
    if not source_task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Walk the dependency graph (BFS)
    visited = set()
    queue = [task_id]
    affected_tasks = []
    affected_target_ids = set()

    while queue:
        current = queue.pop(0)
        if current in visited:
            continue
        visited.add(current)

        # Find downstream tasks
        downstream_result = await db.execute(
            select(TaskDependency.task_id).where(TaskDependency.depends_on_id == current)
        )
        for (downstream_id,) in downstream_result.all():
            if downstream_id not in visited:
                queue.append(downstream_id)
                t_result = await db.execute(select(Task).where(Task.id == downstream_id))
                t = t_result.scalar_one_or_none()
                if t:
                    affected_tasks.append({
                        "task_id": t.id,
                        "title": t.title,
                        "status": t.status,
                        "target_id": t.target_id,
                    })
                    if t.target_id:
                        affected_target_ids.add(t.target_id)

    # Get affected target details
    affected_targets = []
    for tid in affected_target_ids:
        target_result = await db.execute(select(Target).where(Target.id == tid))
        target = target_result.scalar_one_or_none()
        if target:
            affected_targets.append({"target_id": target.id, "title": target.title})

    # Estimate delay (simple heuristic: 2 days per dependency hop)
    estimated_delay = len(affected_tasks) * 2

    return {
        "source_task_id": task_id,
        "source_task_title": source_task.title,
        "affected_tasks": affected_tasks,
        "affected_targets": affected_targets,
        "total_affected_tasks": len(affected_tasks),
        "total_affected_targets": len(affected_targets),
        "estimated_delay_days": estimated_delay,
    }
