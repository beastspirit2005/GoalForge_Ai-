"""Workload Scanner — builds heatmaps and rebalancing suggestions."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.target import Task
from app.models.goal import Goal


def _classify_workload(active_count: int) -> dict:
    """Classify workload status based on active task/goal count."""
    if active_count >= 4:
        return {"status": "overloaded", "emoji": "🔥", "label": "Overloaded"}
    elif active_count >= 2:
        return {"status": "moderate", "emoji": "🟡", "label": "Moderate"}
    else:
        return {"status": "available", "emoji": "🟢", "label": "Available"}


async def build_workload_heatmap(
    db: AsyncSession,
    department: str | None = None,
    manager_id: int | None = None,
) -> dict:
    """Build a workload heatmap for all employees."""
    query = select(User).where(User.role.in_(["employee", "team_lead"]), User.is_active == True)
    if department:
        query = query.where(User.department == department)
    if manager_id:
        query = query.where(User.manager_id == manager_id)

    result = await db.execute(query)
    employees = list(result.scalars().all())

    heatmap = []
    overloaded_count = 0
    moderate_count = 0
    available_count = 0

    for emp in employees:
        # Count active tasks
        task_count_result = await db.execute(
            select(func.count()).select_from(Task)
            .where(Task.assigned_to == emp.id, Task.status.in_(["pending", "assigned", "active"]))
        )
        active_tasks = task_count_result.scalar() or 0

        # Count active goals
        goal_count_result = await db.execute(
            select(func.count()).select_from(Goal)
            .where(Goal.user_id == emp.id, Goal.status.notin_(["completed", "archived"]))
        )
        active_goals = goal_count_result.scalar() or 0

        total_active = active_tasks + active_goals
        classification = _classify_workload(total_active)

        if classification["status"] == "overloaded":
            overloaded_count += 1
        elif classification["status"] == "moderate":
            moderate_count += 1
        else:
            available_count += 1

        heatmap.append({
            "user_id": emp.id,
            "name": emp.name,
            "department": emp.department,
            "active_tasks": active_tasks,
            "active_goals": active_goals,
            "total_active": total_active,
            **classification,
        })

    # Sort: overloaded first, then moderate, then available
    priority = {"overloaded": 0, "moderate": 1, "available": 2}
    heatmap.sort(key=lambda x: (priority.get(x["status"], 3), -x["total_active"]))

    return {
        "total_employees": len(employees),
        "overloaded": overloaded_count,
        "moderate": moderate_count,
        "available": available_count,
        "heatmap": heatmap,
    }


async def suggest_rebalancing(
    db: AsyncSession,
    manager_id: int | None = None,
) -> dict:
    """Suggest task reassignments to balance workload."""
    heatmap_data = await build_workload_heatmap(db, manager_id=manager_id)
    heatmap = heatmap_data["heatmap"]

    overloaded = [e for e in heatmap if e["status"] == "overloaded"]
    available = [e for e in heatmap if e["status"] == "available"]

    suggestions = []

    for ov in overloaded:
        if not available:
            break

        # Find tasks that can be moved
        tasks_result = await db.execute(
            select(Task)
            .where(Task.assigned_to == ov["user_id"], Task.status.in_(["pending", "assigned"]))
            .limit(2)
        )
        movable_tasks = list(tasks_result.scalars().all())

        for task in movable_tasks:
            if not available:
                break

            target_emp = available[0]
            suggestions.append({
                "task_id": task.id,
                "task_title": task.title,
                "from_user_id": ov["user_id"],
                "from_user_name": ov["name"],
                "from_workload": ov["total_active"],
                "to_user_id": target_emp["user_id"],
                "to_user_name": target_emp["name"],
                "to_workload": target_emp["total_active"],
                "reason": f"{ov['name']} is overloaded ({ov['total_active']} items), {target_emp['name']} has capacity ({target_emp['total_active']} items)",
            })

            # Update simulated counts
            target_emp["total_active"] += 1
            if target_emp["total_active"] >= 3:
                available.remove(target_emp)

    return {
        "suggestions": suggestions,
        "total_suggestions": len(suggestions),
    }
