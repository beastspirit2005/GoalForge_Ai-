import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill
import random

SKILLS = [
    "Python", "React", "TypeScript", "SQL", "Management", "Agile", 
    "Communication", "Leadership", "Data Analysis", "System Design",
    "DevOps", "Testing", "UX Design", "Product Strategy", "Project Management"
]

async def seed_skills():
    async with async_session() as db:
        print("Fetching existing skills...")
        existing_skills_res = await db.execute(select(Skill))
        existing_skills = {s.name: s for s in existing_skills_res.scalars().all()}

        # Create missing skills
        new_skills = []
        for s_name in SKILLS:
            if s_name not in existing_skills:
                new_skill = Skill(name=s_name)
                db.add(new_skill)
                new_skills.append(new_skill)
        
        if new_skills:
            await db.commit()
            print(f"Added {len(new_skills)} new skills to the database.")
            # Refetch to get IDs
            existing_skills_res = await db.execute(select(Skill))
            existing_skills = {s.name: s for s in existing_skills_res.scalars().all()}
            
        print("Fetching users...")
        users_res = await db.execute(select(User))
        users = users_res.scalars().all()
        
        print(f"Adding skills to {len(users)} users...")
        skills_list = list(existing_skills.values())
        
        # Clear existing UserSkills just to be safe (optional, or we can just skip if exists)
        # We will check if it exists instead
        existing_user_skills_res = await db.execute(select(UserSkill))
        existing_user_skills = set(
            (us.user_id, us.skill_id) for us in existing_user_skills_res.scalars().all()
        )
        
        count = 0
        for user in users:
            # Assign 3 to 6 random skills per user
            num_skills = random.randint(3, 6)
            user_skills_sample = random.sample(skills_list, min(num_skills, len(skills_list)))
            
            for skill in user_skills_sample:
                if (user.id, skill.id) not in existing_user_skills:
                    us = UserSkill(
                        user_id=user.id,
                        skill_id=skill.id,
                        proficiency=random.uniform(0.3, 1.0),
                        confidence_score=random.uniform(0.4, 0.95),
                        base_source="auto_seed"
                    )
                    db.add(us)
                    existing_user_skills.add((user.id, skill.id))
                    count += 1
                    
        await db.commit()
        print(f"Successfully added {count} skill mappings to users.")

if __name__ == "__main__":
    asyncio.run(seed_skills())
