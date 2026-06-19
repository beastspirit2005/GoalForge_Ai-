"""AI Employee Matcher — scores and ranks employees for task assignments."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.target import Task
from app.models.skill import Skill, UserSkill
from app.models.goal import Goal


async def score_employee_for_task(
    db: AsyncSession,
    employee: User,
    required_skills: list[str],
) -> dict:
    """Score a single employee candidate for a task."""
    reasons = []

    # 1. Skill Fit (40%)
    skills_result = await db.execute(
        select(Skill.name, UserSkill.proficiency)
        .join(UserSkill, UserSkill.skill_id == Skill.id)
        .where(UserSkill.user_id == employee.id)
    )
    user_skills = {name.lower(): prof for name, prof in skills_result.all()}

    if required_skills:
        matched_skills = []
        for req in required_skills:
            req_lower = req.strip().lower()
            if req_lower in user_skills:
                matched_skills.append((req, user_skills[req_lower]))

        skill_fit = len(matched_skills) / len(required_skills) if required_skills else 0.0

        for skill_name, prof in matched_skills:
            reasons.append(f"✓ {skill_name} expertise (proficiency: {prof:.0f}%)")
    else:
        skill_fit = 0.5

    # 2. Completion Rate (25%)
    completed_result = await db.execute(
        select(func.count()).select_from(Goal)
        .where(Goal.user_id == employee.id, Goal.status == "completed")
    )
    completed = completed_result.scalar() or 0

    total_result = await db.execute(
        select(func.count()).select_from(Goal)
        .where(Goal.user_id == employee.id)
    )
    total = total_result.scalar() or 1

    completion_rate = completed / max(total, 1)
    if completion_rate > 0.8:
        reasons.append(f"✓ {completion_rate*100:.0f}% completion rate")

    # 3. Availability (20%)
    active_tasks_result = await db.execute(
        select(func.count()).select_from(Task)
        .where(Task.assigned_to == employee.id, Task.status.in_(["pending", "assigned", "active"]))
    )
    active_tasks = active_tasks_result.scalar() or 0
    max_tasks = 5
    availability = max(0.0, 1.0 - (active_tasks / max_tasks))

    if active_tasks <= 1:
        reasons.append(f"✓ Only {active_tasks} active task(s)")
    elif active_tasks >= 4:
        reasons.append(f"⚠ Already has {active_tasks} active tasks")

    # 4. Track Record (15%) — similar task success
    similar_result = await db.execute(
        select(func.count()).select_from(Goal)
        .where(Goal.user_id == employee.id, Goal.status == "completed")
    )
    similar_completed = similar_result.scalar() or 0
    track_record = min(1.0, similar_completed / 3.0)
    if similar_completed > 0:
        reasons.append(f"✓ Completed {similar_completed} similar goal(s) successfully")

    # Composite score
    score = (
        skill_fit * 0.40 +
        completion_rate * 0.25 +
        availability * 0.20 +
        track_record * 0.15
    )

    return {
        "user_id": employee.id,
        "name": employee.name,
        "department": employee.department,
        "score": round(score * 100, 1),
        "factors": {
            "skill_fit": round(skill_fit * 100, 1),
            "completion_rate": round(completion_rate * 100, 1),
            "availability": round(availability * 100, 1),
            "track_record": round(track_record * 100, 1),
        },
        "reasons": reasons,
        "active_tasks": active_tasks,
    }


async def recommend_employees_for_task(
    db: AsyncSession,
    task_id: int,
) -> dict:
    """Rank all employees for a given task."""
    task_result = await db.execute(select(Task).where(Task.id == task_id))
    task = task_result.scalar_one_or_none()
    if not task:
        return {"error": "Task not found"}

    required_skills = [s.strip() for s in (task.required_skills or "").split(",") if s.strip()]

    # Get all employees
    employees_result = await db.execute(
        select(User).where(User.role.in_(["employee", "team_lead"]), User.is_active == True)
    )
    employees = list(employees_result.scalars().all())

    if not employees:
        return {"task_id": task_id, "recommendations": [], "message": "No employees available"}

    scored = []
    for emp in employees:
        result = await score_employee_for_task(db, emp, required_skills)
        scored.append(result)

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "task_id": task_id,
        "task_title": task.title,
        "required_skills": required_skills,
        "recommendations": scored[:5],
    }
