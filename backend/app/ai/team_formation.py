"""AI Team Formation — selects optimal team covering all required skills for a target."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.target import Target


async def suggest_team_for_target(
    db: AsyncSession,
    target_id: int,
) -> dict:
    """Suggest an optimal team that covers all required skills for a target."""
    target_result = await db.execute(select(Target).where(Target.id == target_id))
    target = target_result.scalar_one_or_none()
    if not target:
        return {"error": "Target not found"}

    required_skills = [s.strip() for s in (target.required_skills or "").split(",") if s.strip()]
    if not required_skills:
        return {"target_id": target_id, "message": "No required skills defined for this target"}

    # Get all available employees with their skills
    employees_result = await db.execute(
        select(User).where(User.role.in_(["employee", "team_lead"]), User.is_active == True)
    )
    employees = list(employees_result.scalars().all())

    # Build skill maps per employee
    employee_skill_map = {}
    for emp in employees:
        skills_result = await db.execute(
            select(Skill.name, UserSkill.proficiency)
            .join(UserSkill, UserSkill.skill_id == Skill.id)
            .where(UserSkill.user_id == emp.id)
        )
        emp_skills = {name.lower(): prof for name, prof in skills_result.all()}
        employee_skill_map[emp.id] = {
            "user": emp,
            "skills": emp_skills,
        }

    # Greedy set-cover: pick employees that cover the most uncovered skills
    uncovered = {s.strip().lower() for s in required_skills}
    selected_team = []
    remaining_employees = list(employee_skill_map.values())

    while uncovered and remaining_employees:
        best = None
        best_coverage = set()

        for emp_data in remaining_employees:
            coverage = uncovered & set(emp_data["skills"].keys())
            if len(coverage) > len(best_coverage):
                best = emp_data
                best_coverage = coverage

        if best is None or len(best_coverage) == 0:
            break

        user = best["user"]
        selected_team.append({
            "user_id": user.id,
            "name": user.name,
            "department": user.department,
            "covers_skills": list(best_coverage),
            "proficiencies": {s: best["skills"].get(s, 0) for s in best_coverage},
        })
        uncovered -= best_coverage
        remaining_employees.remove(best)

    # Calculate coverage
    total_required = len(required_skills)
    covered = total_required - len(uncovered)

    return {
        "target_id": target_id,
        "target_title": target.title,
        "required_skills": required_skills,
        "suggested_team": selected_team,
        "skill_coverage": {
            "total_required": total_required,
            "covered": covered,
            "uncovered": list(uncovered),
            "coverage_percentage": round((covered / max(total_required, 1)) * 100, 1),
        },
    }
