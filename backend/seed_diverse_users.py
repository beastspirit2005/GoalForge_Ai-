import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.core.security import hash_password
from sqlalchemy import select

async def seed():
    async with async_session() as db:
        password = hash_password("password")
        
        users_to_add = [
            {"name": "Alice Chen", "email": "alice@goalforge.ai", "role": "employee", "skills": ["Java", "Spring Boot", "Microservices"]},
            {"name": "Bob Smith", "email": "bob@goalforge.ai", "role": "employee", "skills": ["Figma", "UI/UX", "CSS"]},
            {"name": "Charlie Davis", "email": "charlie@goalforge.ai", "role": "employee", "skills": ["C++", "Systems Programming"]},
            {"name": "Diana Evans", "email": "diana@goalforge.ai", "role": "employee", "skills": ["Content Writing", "SEO", "Marketing"]},
            {"name": "Eve Torres", "email": "eve@goalforge.ai", "role": "manager", "skills": ["Agile", "Scrum"]},
            {"name": "Frank White", "email": "frank@goalforge.ai", "role": "manager", "skills": ["Product Management", "Roadmapping"]},
        ]
        
        for data in users_to_add:
            # Check if user exists
            res = await db.execute(select(User).where(User.email == data["email"]))
            user = res.scalar_one_or_none()
            if not user:
                user = User(
                    name=data["name"],
                    email=data["email"],
                    password_hash=password,
                    role=data["role"],
                    is_active=True,
                    is_approved=True
                )
                db.add(user)
                await db.flush()
                print(f"Added {data['role']}: {data['name']}")
                
            # Add skills
            for s_name in data["skills"]:
                # ensure skill exists
                res_skill = await db.execute(select(Skill).where(Skill.name == s_name))
                skill = res_skill.scalar_one_or_none()
                if not skill:
                    skill = Skill(name=s_name)
                    db.add(skill)
                    await db.flush()
                
                # ensure UserSkill exists
                res_uskill = await db.execute(select(UserSkill).where(UserSkill.user_id == user.id, UserSkill.skill_id == skill.id))
                uskill = res_uskill.scalar_one_or_none()
                if not uskill:
                    db.add(UserSkill(
                        user_id=user.id,
                        skill_id=skill.id,
                        proficiency=5.0,
                        confidence_score=0.9,
                        base_source="manual"
                    ))
        
        await db.commit()
        print("Successfully seeded diverse users and skills!")

if __name__ == "__main__":
    asyncio.run(seed())
