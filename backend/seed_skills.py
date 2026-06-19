import asyncio
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill

async def seed():
    async with async_session() as db:
        # Get employees
        result = await db.execute(select(User).where(User.role == "employee"))
        employees = result.scalars().all()
        
        # Ensure they report to manager ID 3 (Priya Nair)
        for emp in employees:
            emp.manager_id = 3
        
        # Create Skills
        skill_names = [
            "Python", "React", "Kubernetes", "Data Engineering", 
            "Machine Learning", "Go", "AWS", "Product Management",
            "UI/UX Design", "Leadership"
        ]
        
        db_skills = []
        for name in skill_names:
            # Check if skill exists
            res = await db.execute(select(Skill).where(Skill.name == name))
            skill = res.scalar_one_or_none()
            if not skill:
                skill = Skill(name=name)
                db.add(skill)
            db_skills.append(skill)
            
        await db.commit()
        
        # Now we need the committed skill IDs
        for skill in db_skills:
            await db.refresh(skill)
            
        # Give each employee 4-6 random skills with random proficiencies (1-5)
        for emp in employees:
            assigned_skills = random.sample(db_skills, random.randint(4, 6))
            for skill in assigned_skills:
                # Check if user_skill already exists
                res = await db.execute(
                    select(UserSkill).where(UserSkill.user_id == emp.id, UserSkill.skill_id == skill.id)
                )
                us = res.scalar_one_or_none()
                if not us:
                    us = UserSkill(
                        user_id=emp.id,
                        skill_id=skill.id,
                        proficiency=random.uniform(1.0, 5.0),
                        confidence_score=random.uniform(0.7, 1.0),
                        base_source="manager_assessment"
                    )
                    db.add(us)
                else:
                    us.proficiency = random.uniform(1.0, 5.0)
                    
        await db.commit()
        print(f"Seeded {len(employees)} employees with skills!")

if __name__ == "__main__":
    asyncio.run(seed())
