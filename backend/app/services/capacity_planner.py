"""Capacity Planner — forecasts team capacity vs workload demand."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.target import Task


async def compute_capacity_forecast(
    db: AsyncSession,
    department: str | None = None,
    manager_id: int | None = None,
) -> dict:
    """
    Compute capacity vs demand forecast.

    Capacity = active_employees * avg_tasks_per_employee (default 3)
    Demand = total pending/active tasks
    Gap = (Demand - Capacity) / Capacity
    """
    AVG_TASKS_PER_EMPLOYEE = 3

    # Count available employees
    emp_query = select(func.count()).select_from(User).where(
        User.is_active == True,
        User.role.in_(["employee", "team_lead"]),
    )
    if department:
        emp_query = emp_query.where(User.department == department)
    if manager_id:
        emp_query = emp_query.where(User.manager_id == manager_id)

    emp_count_result = await db.execute(emp_query)
    employee_count = emp_count_result.scalar() or 0

    capacity = employee_count * AVG_TASKS_PER_EMPLOYEE

    # Count active/pending tasks (demand)
    task_query = select(func.count()).select_from(Task).where(
        Task.status.in_(["pending", "assigned", "active"])
    )
    task_count_result = await db.execute(task_query)
    demand = task_count_result.scalar() or 0

    # Calculate gap
    if capacity > 0:
        gap_percentage = round(((demand - capacity) / capacity) * 100, 1)
    else:
        gap_percentage = 100.0 if demand > 0 else 0.0

    # Determine status
    if gap_percentage > 20:
        status = "understaffed"
        recommendation = f"Team is understaffed by {gap_percentage}%. Consider hiring or redistributing workload."
    elif gap_percentage < -20:
        status = "overstaffed"
        recommendation = f"Team has excess capacity ({abs(gap_percentage)}%). Consider taking on more initiatives."
    else:
        status = "balanced"
        recommendation = "Team capacity is well-balanced with current demand."

    return {
        "employee_count": employee_count,
        "capacity_tasks": capacity,
        "demand_tasks": demand,
        "gap_percentage": gap_percentage,
        "status": status,
        "recommendation": recommendation,
        "department": department,
    }
