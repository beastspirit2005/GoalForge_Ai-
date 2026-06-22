import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.models.user import User
from app.models.target import Target, Task, TargetRequiredSkill, TaskRequiredSkill
from app.models.skill import Skill, UserSkill
from sqlalchemy import select, text

async def seed():
    async with async_session() as db:
        # Get users
        res = await db.execute(select(User).where(User.email == "manager@goalforge.ai"))
        manager = res.scalar_one_or_none()
        res = await db.execute(select(User).where(User.email == "employee@goalforge.ai"))
        employee = res.scalar_one_or_none()
        
        if not manager or not employee:
            print("Demo users not found!")
            return

        print(f"Manager ID: {manager.id}, Employee ID: {employee.id}")

        # Seed Skills
        skill_names = ["Python", "React", "PostgreSQL", "Digital Marketing", "Node.js"]
        skill_ids = {}
        for s in skill_names:
            res = await db.execute(select(Skill).where(Skill.name == s))
            skill = res.scalar_one_or_none()
            if not skill:
                skill = Skill(name=s)
                db.add(skill)
                await db.flush()
            skill_ids[s] = skill.id
        
        await db.commit()

        # Add UserSkills to employee
        for s in ["Python", "React", "PostgreSQL"]:
            s_id = skill_ids[s]
            res = await db.execute(select(UserSkill).where(UserSkill.user_id == employee.id, UserSkill.skill_id == s_id))
            if not res.scalar_one_or_none():
                db.add(UserSkill(
                    user_id=employee.id, 
                    skill_id=s_id, 
                    proficiency=5.0, 
                    confidence_score=0.9, 
                    base_source="manual"
                ))
        
        await db.commit()

        # Create Target
        res = await db.execute(select(Target).where(Target.title == "Launch Q4 Marketing Campaign"))
        if not res.scalar_one_or_none():
            target = Target(
                title="Launch Q4 Marketing Campaign",
                description="High level objectives and desired outcomes...",
                manager_id=manager.id,
                status="active"
            )
            db.add(target)
            await db.flush()

            db.add(TargetRequiredSkill(target_id=target.id, skill_name="React"))
            db.add(TargetRequiredSkill(target_id=target.id, skill_name="Node.js"))
            db.add(TargetRequiredSkill(target_id=target.id, skill_name="Digital Marketing"))

            # Create Task
            task1 = Task(
                target_id=target.id,
                title="Develop Landing Page",
                description="Build the React components for the new landing page.",
                status="pending"
            )
            db.add(task1)
            await db.flush()

            db.add(TaskRequiredSkill(task_id=task1.id, skill_name="React"))

            await db.commit()
            print(f"Target {target.id} and Task {task1.id} seeded successfully.")
        else:
            print("Demo data already seeded.")

if __name__ == "__main__":
    asyncio.run(seed())
