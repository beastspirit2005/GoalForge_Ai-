from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.target import Target, Task
from app.models.skill import UserSkill, Skill
from app.schemas.target_schema import TargetCreate, TargetResponse, TaskCreate, TaskResponse
from app.ai.auto_assigner import generate_auto_assignment

router = APIRouter()

# --- TARGETS ---

@router.post("/targets", response_model=TargetResponse, status_code=status.HTTP_201_CREATED)
async def create_target(
    data: TargetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target = Target(
        title=data.title,
        description=data.description,
        required_skills=data.required_skills,
        manager_id=data.manager_id or current_user.id,
        deadline=data.deadline
    )
    db.add(target)
    await db.flush()
    await db.refresh(target)
    return target

@router.get("/targets", response_model=list[TargetResponse])
async def list_targets(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Target).order_by(Target.created_at.desc()))
    return list(result.scalars().all())

# --- TASKS ---

@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = Task(
        target_id=data.target_id,
        title=data.title,
        description=data.description,
        required_skills=data.required_skills,
        assigned_to=data.assigned_to,
        deadline=data.deadline
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task

@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(target_id: int | None = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = select(Task)
    if target_id:
        query = query.where(Task.target_id == target_id)
    result = await db.execute(query.order_by(Task.created_at.desc()))
    return list(result.scalars().all())

@router.post("/tasks/{task_id}/auto-assign")
async def auto_assign_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the task
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get all users and their skills
    users_result = await db.execute(
        select(User).options(selectinload(User.user_skills).selectinload(UserSkill.skill))
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

    task_data = {
        "title": task.title,
        "description": task.description,
        "required_skills": task.required_skills
    }

    assignment = await generate_auto_assignment(task_data, available_users)
    
    if assignment.get("assigned_user_id"):
        task.assigned_to = assignment["assigned_user_id"]
        task.status = "assigned"
        await db.flush()
        
    return {
        "task_id": task.id,
        "assigned_user_id": assignment.get("assigned_user_id"),
        "reason": assignment.get("reason"),
        "status": "success"
    }
