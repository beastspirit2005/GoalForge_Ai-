from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from cachetools import TTLCache

from app.models.user import User
from app.models.skill import UserSkill, Skill
from app.models.target import Task, TaskRequiredSkill

# Global cache to prevent heavy DB queries (max 100 entries, 5 minute TTL)
workforce_insights_cache = TTLCache(maxsize=100, ttl=300)

async def analyze_workforce_skills(db: AsyncSession, department: str | None = None) -> dict:
    """
    Analyzes the skills of users using DB aggregations,
    and compares them to required skills to find gaps.
    """
    cache_key = f"workforce_skills_{department or 'all'}"
    if cache_key in workforce_insights_cache:
        return workforce_insights_cache[cache_key]

    # Aggregate skill proficiencies across the workforce via SQL
    skill_inventory = {}
    
    # 1. Total Employees
    users_query = select(func.count(User.id)).where(User.is_active == True)
    if department:
        users_query = users_query.where(User.department == department)
    total_employees = await db.scalar(users_query)
    
    # 2. Skill aggregates (Count, Total Proficiency)
    skills_query = select(
        Skill.name, 
        func.count(UserSkill.user_id).label("count"), 
        func.sum(UserSkill.proficiency).label("total_proficiency")
    ).join(Skill, UserSkill.skill_id == Skill.id)
    
    if department:
        skills_query = skills_query.join(User, UserSkill.user_id == User.id).where(User.department == department)
    skills_query = skills_query.group_by(Skill.name)
    
    skills_result = await db.execute(skills_query)
    for row in skills_result:
        skill_name = row.name
        skill_inventory[skill_name] = {
            "count": row.count,
            "total_proficiency": row.total_proficiency,
            "average_proficiency": row.total_proficiency / row.count if row.count > 0 else 0
        }

    # 3. Required skills tally
    # Using SQL aggregations for required skills
    required_query = select(
        TaskRequiredSkill.skill_name, 
        func.count(TaskRequiredSkill.task_id).label("count")
    ).join(Task).where(Task.status != "completed").group_by(TaskRequiredSkill.skill_name)
    
    required_result = await db.execute(required_query)
    required_skills_tally = {row.skill_name: row.count for row in required_result}

    # 4. Find Gaps
    # In a full implementation, we match skill_name from Skill table with TaskRequiredSkill.skill_name
    gaps = [skill for skill in required_skills_tally.keys() if skill not in skill_inventory] # Mock gap finding

    result = {
        "total_employees_analyzed": total_employees or 0,
        "skill_inventory": skill_inventory,
        "high_demand_skills": required_skills_tally,
        "critical_skill_gaps": gaps
    }
    
    workforce_insights_cache[cache_key] = result
    return result
