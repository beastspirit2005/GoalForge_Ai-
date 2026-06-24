from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/hierarchy", tags=["Hierarchy"])

@router.get("/me")
async def get_my_hierarchy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = {"admin": None, "manager": None, "employees": [], "teammates": []}
    
    # 1. Fetch Admin
    if current_user.admin_id:
        admin_res = await db.execute(select(User).where(User.id == current_user.admin_id))
        admin = admin_res.scalar_one_or_none()
        if admin:
            result["admin"] = {"id": admin.id, "name": admin.name, "email": admin.email, "role": admin.role, "department": admin.department}

    # 2. Fetch Manager
    if current_user.manager_id:
        mgr_res = await db.execute(select(User).where(User.id == current_user.manager_id))
        mgr = mgr_res.scalar_one_or_none()
        if mgr:
            result["manager"] = {"id": mgr.id, "name": mgr.name, "email": mgr.email, "role": mgr.role, "department": mgr.department}

    from app.models.goal import Goal
    from app.models.target import Task, TaskAssignee
    from sqlalchemy.orm import selectinload

    async def get_user_stats(user_ids):
        if not user_ids:
            return {}, {}
        # Fetch goals
        goals_res = await db.execute(select(Goal).where(Goal.user_id.in_(user_ids)))
        goals_data = goals_res.scalars().all()
        # Fetch tasks
        tasks_res = await db.execute(
            select(Task).join(TaskAssignee, Task.id == TaskAssignee.task_id)
            .where(TaskAssignee.user_id.in_(user_ids))
        )
        tasks_data = tasks_res.scalars().all()
        
        # Also fetch tasks directly assigned via assigned_to (legacy)
        legacy_tasks_res = await db.execute(select(Task).where(Task.assigned_to.in_(user_ids)))
        tasks_data.extend(legacy_tasks_res.scalars().all())
        
        # Deduplicate tasks
        unique_tasks = {t.id: t for t in tasks_data}.values()

        return goals_data, list(unique_tasks)

    # 3. Fetch Teammates (if employee)
    if current_user.role == "employee" and current_user.manager_id:
        teammates_res = await db.execute(
            select(User).where(User.manager_id == current_user.manager_id, User.id != current_user.id, User.is_active == True)
        )
        teammates = teammates_res.scalars().all()
        
        goals_data, tasks_data = await get_user_stats([t.id for t in teammates])
        
        result["teammates"] = [
            {
                "id": t.id, "name": t.name, "email": t.email, "role": t.role, "department": t.department, "manager_id": t.manager_id,
                "goals": [{"id": g.id, "title": g.title, "status": g.status, "progress": g.progress} for g in goals_data if g.user_id == t.id],
                "tasks": [{"id": tk.id, "title": tk.title, "status": tk.status, "progress": tk.progress, "deadline": tk.deadline} for tk in tasks_data if tk.assigned_to == t.id or any(a.id == t.id for a in getattr(tk, 'assignees', []))]
            }
            for t in teammates
        ]

    # 4. Fetch Direct Employees (if manager)
    if current_user.role == "manager":
        emp_res = await db.execute(select(User).where(User.manager_id == current_user.id, User.is_active == True))
        employees = emp_res.scalars().all()
        
        goals_data, tasks_data = await get_user_stats([e.id for e in employees])
        
        result["employees"] = [
            {
                "id": e.id, "name": e.name, "email": e.email, "role": e.role, "department": e.department, "manager_id": e.manager_id,
                "goals": [{"id": g.id, "title": g.title, "status": g.status, "progress": g.progress} for g in goals_data if g.user_id == e.id],
                "tasks": [{"id": tk.id, "title": tk.title, "status": tk.status, "progress": tk.progress, "deadline": tk.deadline} for tk in tasks_data if tk.assigned_to == e.id or any(a.id == e.id for a in getattr(tk, 'assignees', []))]
            }
            for e in employees
        ]

    return result
