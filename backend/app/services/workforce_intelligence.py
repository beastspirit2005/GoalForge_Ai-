from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.skill import UserSkill, Skill
from app.models.target import Target, Task

async def analyze_workforce_skills(db: AsyncSession, department: str | None = None) -> dict:
    """
    Analyzes the skills of users, optionally filtered by department,
    and compares them to the required skills of active tasks to find gaps.
    """
    users_query = select(User).options(selectinload(User.user_skills).selectinload(UserSkill.skill))
    if department:
        users_query = users_query.where(User.department == department)
        
    users_result = await db.execute(users_query)
    users = users_result.scalars().all()
    
    # Aggregate skill proficiencies
    skill_inventory = {}
    for u in users:
        for us in getattr(u, 'user_skills', []):
            skill_name = us.skill.name
            if skill_name not in skill_inventory:
                skill_inventory[skill_name] = {"count": 0, "total_proficiency": 0}
            skill_inventory[skill_name]["count"] += 1
            skill_inventory[skill_name]["total_proficiency"] += us.proficiency
            
    # Calculate average proficiencies
    for k, v in skill_inventory.items():
        v["average_proficiency"] = v["total_proficiency"] / v["count"]
        
    # Find skill gaps (Tasks that require a skill no one has)
    tasks_result = await db.execute(select(Task).where(Task.status != "completed"))
    tasks = tasks_result.scalars().all()
    
    gaps = []
    required_skills_tally = {}
    for t in tasks:
        if t.required_skills:
            # Assuming comma separated for simplicity
            for req in [s.strip() for s in t.required_skills.split(",")]:
                required_skills_tally[req] = required_skills_tally.get(req, 0) + 1
                if req not in skill_inventory:
                    if req not in gaps:
                        gaps.append(req)
                        
    return {
        "total_employees_analyzed": len(users),
        "skill_inventory": skill_inventory,
        "high_demand_skills": required_skills_tally,
        "critical_skill_gaps": gaps
    }
