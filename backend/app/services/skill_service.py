from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.models.skill import Skill, UserSkill

async def create_skill(db: AsyncSession, name: str) -> Skill:
    skill = Skill(name=name)
    db.add(skill)
    await db.flush()
    await db.refresh(skill)
    return skill

async def get_skills(db: AsyncSession) -> list[Skill]:
    result = await db.execute(select(Skill))
    return list(result.scalars().all())

async def get_user_skills(db: AsyncSession, user_id: int) -> list[UserSkill]:
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
    return list(result.scalars().all())

async def add_user_skill(
    db: AsyncSession, user_id: int, skill_id: int, proficiency: float, confidence_score: float = 1.0, base_source: str = "manual"
) -> UserSkill:
    # Check if exists
    result = await db.execute(
        select(UserSkill).where(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id)
    )
    user_skill = result.scalar_one_or_none()
    
    if user_skill:
        user_skill.proficiency = proficiency
        user_skill.confidence_score = confidence_score
        user_skill.base_source = base_source
    else:
        user_skill = UserSkill(
            user_id=user_id,
            skill_id=skill_id,
            proficiency=proficiency,
            confidence_score=confidence_score,
            base_source=base_source
        )
        db.add(user_skill)
        
    await db.flush()
    await db.refresh(user_skill)
    return user_skill

async def remove_user_skill(db: AsyncSession, user_id: int, skill_id: int):
    await db.execute(
        delete(UserSkill).where(UserSkill.user_id == user_id, UserSkill.skill_id == skill_id)
    )
    await db.flush()
