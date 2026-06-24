from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.target import Target, Task, TargetRequiredSkill, TaskRequiredSkill
from app.models.skill import UserSkill, Skill
from app.schemas.target_schema import TargetCreate, TargetResponse, TaskCreate, TaskResponse, TargetUpdate, TaskUpdate
from app.ai.auto_assigner import generate_auto_assignment

router = APIRouter()

def serialize_target(target: Target) -> dict:
    return {
        "id": target.id,
        "title": target.title,
        "description": target.description,
        "required_skills": [s.skill_name for s in getattr(target, 'required_skills', [])],
        "manager_id": target.manager_id,
        "manager_name": getattr(target, 'manager', None).name if getattr(target, 'manager', None) else None,
        "pending_review": target.pending_review,
        "progress": target.progress,
        "deadline": target.deadline,
        "status": target.status,
        "created_at": target.created_at,
        "updated_at": target.updated_at
    }

def serialize_task(task: Task) -> dict:
    return {
        "id": task.id,
        "target_id": task.target_id,
        "title": task.title,
        "description": task.description,
        "required_skills": [s.skill_name for s in getattr(task, 'required_skills', [])],
        "assigned_to": task.assigned_to,
        "assigned_user_name": getattr(task, 'assignee', None).name if getattr(task, 'assignee', None) else None,
        "assignees": [
            {"id": u.id, "name": u.name}
            for u in getattr(task, 'assignees', [])
        ],
        "goals": [
            {
                "id": g.id, "title": g.title,
                "owner_name": g.owner.name if g.owner else None,
                "owner_id": g.user_id,
                "progress": g.progress, "status": g.status,
            }
            for g in getattr(task, 'goals', [])
        ],
        "pending_review": task.pending_review,
        "progress": task.progress,
        "deadline": task.deadline,
        "status": task.status,
        "created_at": task.created_at,
        "updated_at": task.updated_at
    }

# --- TARGETS ---

@router.post("/targets", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(
    data: TargetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "super_admin", "department_head", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized to create targets")

    target = Target(
        title=data.title,
        description=data.description,
        manager_id=data.manager_id or current_user.id,
        deadline=data.deadline
    )
    db.add(target)
    await db.flush()
    await db.refresh(target)

    if data.required_skills:
        for skill_name in data.required_skills:
            if skill_name.strip():
                ts = TargetRequiredSkill(target_id=target.id, skill_name=skill_name.strip())
                db.add(ts)
        await db.commit()
    
    await db.refresh(target, ["required_skills", "manager"])
    return serialize_target(target)

@router.get("/targets", response_model=list[TargetResponse])
async def list_targets(
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    query = select(Target).options(selectinload(Target.required_skills), selectinload(Target.manager)).order_by(Target.created_at.desc())
    
    # RBAC Filter
    if current_user.role not in ("admin", "super_admin"):
        query = query.where(Target.manager_id == current_user.id)
        
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    targets = result.scalars().all()
    return [serialize_target(t) for t in targets]

# --- TASKS ---

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify Target
    target_result = await db.execute(select(Target).where(Target.id == data.target_id))
    target = target_result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
        
    if current_user.role not in ("admin", "super_admin") and target.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add tasks to this target")

    task = Task(
        target_id=data.target_id,
        title=data.title,
        description=data.description,
        assigned_to=data.assigned_to,
        deadline=data.deadline
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)

    if data.required_skills:
        for skill_name in data.required_skills:
            if skill_name.strip():
                ts = TaskRequiredSkill(task_id=task.id, skill_name=skill_name.strip())
                db.add(ts)
        await db.commit()

    # Handle multi-assignees
    if data.assignee_ids:
        from app.models.target import TaskAssignee
        task.assigned_to = data.assignee_ids[0]
        task.status = "assigned"
        for uid in data.assignee_ids:
            db.add(TaskAssignee(task_id=task.id, user_id=uid))
        await db.flush()

    # Fetch fresh task with all relationships
    from app.models.goal import Goal
    fresh_res = await db.execute(
        select(Task).options(
            selectinload(Task.required_skills), 
            selectinload(Task.assignee),
            selectinload(Task.assignees),
            selectinload(Task.goals).selectinload(Goal.owner)
        ).where(Task.id == task.id)
    )
    fresh_task = fresh_res.scalar_one()
    return serialize_task(fresh_task)

@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    target_id: int | None = None, 
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    from app.models.goal import Goal
    query = select(Task).options(
        selectinload(Task.required_skills), 
        selectinload(Task.assignee),
        selectinload(Task.assignees),
        selectinload(Task.goals).selectinload(Goal.owner)
    ).order_by(Task.created_at.desc())
    
    if target_id:
        query = query.where(Task.target_id == target_id)
        
    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return [serialize_task(t) for t in result.scalars().all()]

@router.post("/tasks/{task_id}/auto-assign")
async def auto_assign_task(
    task_id: int,
    ai_provider: str = Query("gemini", description="AI Provider (gemini/ollama)"),
    ai_model: str = Query("gemini-2.5-flash", description="AI Model"),
    x_gemini_key: str | None = Header(None, description="Custom Gemini API Key"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the task
    task_result = await db.execute(
        select(Task).options(selectinload(Task.required_skills)).where(Task.id == task_id)
    )
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    target_result = await db.execute(select(Target).where(Target.id == task.target_id))
    target = target_result.scalar_one_or_none()
    
    # RBAC: Only manager or admin can assign
    if current_user.role not in ("admin", "super_admin") and target and target.manager_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to auto-assign this task")

    # Limit the number of users loaded to prevent OOM
    users_result = await db.execute(
        select(User)
        .where(User.is_active == True)
        .options(selectinload(User.user_skills).selectinload(UserSkill.skill))
        .limit(200) # Prevents loading 100,000 users
    )
    users = users_result.scalars().all()
    
    available_users = []
    for u in users:
        skills = [{"name": us.skill.name, "proficiency": us.proficiency} for us in getattr(u, 'user_skills', [])]
        available_users.append({
            "id": u.id,
            "name": u.name,
            "skills": skills
        })

    required_skills_list = [s.skill_name for s in getattr(task, 'required_skills', [])]

    task_data = {
        "title": task.title,
        "description": task.description,
        "required_skills": ", ".join(required_skills_list) if required_skills_list else "None"
    }

    assignment = await generate_auto_assignment(
        task_data, 
        available_users, 
        api_key=x_gemini_key,
        ai_provider=ai_provider, 
        ai_model=ai_model
    )
    assigned_ids = assignment.get("assigned_user_ids", [])
    if not assigned_ids and assignment.get("assigned_user_id"):
        assigned_ids = [assignment["assigned_user_id"]]
    
    if assigned_ids:
        from app.models.target import TaskAssignee
        # Also set legacy assigned_to for backward compat
        task.assigned_to = assigned_ids[0]
        task.status = "assigned"
        # Add to junction table
        for uid in assigned_ids:
            existing = await db.execute(
                select(TaskAssignee).where(TaskAssignee.task_id == task.id, TaskAssignee.user_id == uid)
            )
            if not existing.scalar_one_or_none():
                db.add(TaskAssignee(task_id=task.id, user_id=uid))
        await db.commit()
        
    return {
        "task_id": task.id,
        "assigned_user_ids": assigned_ids,
        "assigned_user_id": assigned_ids[0] if assigned_ids else None,
        "reason": assignment.get("reason"),
        "status": "success"
    }

@router.put("/targets/{target_id}", response_model=TargetResponse)
async def update_target(
    target_id: int,
    data: TargetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    res = await db.execute(select(Target).options(selectinload(Target.required_skills), selectinload(Target.manager)).where(Target.id == target_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    
    if data.title is not None: target.title = data.title
    if data.description is not None: target.description = data.description
    if data.manager_id is not None: target.manager_id = data.manager_id
    if data.deadline is not None: target.deadline = data.deadline
    
    if data.required_skills is not None:
        await db.execute(delete(TargetRequiredSkill).where(TargetRequiredSkill.target_id == target.id))
        for skill_name in data.required_skills:
            if skill_name.strip():
                db.add(TargetRequiredSkill(target_id=target.id, skill_name=skill_name.strip()))
                
    await db.commit()
    # Fetch fresh target with all relationships
    fresh_res = await db.execute(
        select(Target).options(
            selectinload(Target.required_skills), 
            selectinload(Target.manager)
        ).where(Target.id == target.id)
    )
    fresh_target = fresh_res.scalar_one()
    return serialize_target(fresh_target)

@router.delete("/targets/{target_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_target(
    target_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
    res = await db.execute(select(Target).where(Target.id == target_id))
    target = res.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="Target not found")
    await db.delete(target)
    await db.commit()
    return None

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "super_admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized")
    res = await db.execute(select(Task).options(selectinload(Task.required_skills), selectinload(Task.assignee)).where(Task.id == task_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if data.title is not None: task.title = data.title
    if data.description is not None: task.description = data.description
    if data.assigned_to is not None: task.assigned_to = data.assigned_to
    if data.deadline is not None: task.deadline = data.deadline
    
    if data.required_skills is not None:
        await db.execute(delete(TaskRequiredSkill).where(TaskRequiredSkill.task_id == task.id))
        for skill_name in data.required_skills:
            if skill_name.strip():
                db.add(TaskRequiredSkill(task_id=task.id, skill_name=skill_name.strip()))
                
    if data.assignee_ids is not None:
        from app.models.target import TaskAssignee
        await db.execute(delete(TaskAssignee).where(TaskAssignee.task_id == task.id))
        for uid in data.assignee_ids:
            db.add(TaskAssignee(task_id=task.id, user_id=uid))
        if data.assignee_ids:
            task.assigned_to = data.assignee_ids[0]
            task.status = "assigned"
        else:
            task.assigned_to = None
            task.status = "pending"

    await db.commit()
    # Fetch fresh task with all relationships
    from app.models.goal import Goal
    fresh_res = await db.execute(
        select(Task).options(
            selectinload(Task.required_skills), 
            selectinload(Task.assignee),
            selectinload(Task.assignees),
            selectinload(Task.goals).selectinload(Goal.owner)
        ).where(Task.id == task.id)
    )
    fresh_task = fresh_res.scalar_one()
    return serialize_task(fresh_task)

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin", "super_admin", "manager"):
        raise HTTPException(status_code=403, detail="Not authorized")
    res = await db.execute(select(Task).where(Task.id == task_id))
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)
    await db.commit()
    return None
