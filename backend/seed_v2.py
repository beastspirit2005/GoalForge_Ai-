import asyncio
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.target import Target, Task, TargetRequiredSkill, TaskRequiredSkill

async def seed():
    async with async_session() as db:
        print("Clearing old targets/tasks...")
        await db.execute(delete(Target))
        await db.commit()

        # Get the first admin
        res = await db.execute(select(User).where(User.role == "admin").limit(1))
        admin = res.scalar_one_or_none()

        if not admin:
            # Create an admin if none
            admin = User(name="System Admin", email="admin@goalforge.ai", password_hash="dummy", role="admin")
            db.add(admin)
            await db.commit()
            await db.refresh(admin)

        # Create some users
        print("Ensuring some employees exist...")
        employees = []
        for i in range(1, 4):
            res = await db.execute(select(User).where(User.email == f"dev{i}@goalforge.ai"))
            emp = res.scalar_one_or_none()
            if not emp:
                emp = User(name=f"Developer {i}", email=f"dev{i}@goalforge.ai", password_hash="dummy", role="employee", manager_id=admin.id)
                db.add(emp)
                await db.commit()
                await db.refresh(emp)
            employees.append(emp)

        # Skills
        skill_names = ["Python", "React", "PostgreSQL", "Docker", "Machine Learning"]
        
        for name in skill_names:
            res = await db.execute(select(Skill).where(Skill.name == name))
            if not res.scalar_one_or_none():
                db.add(Skill(name=name))
        await db.commit()

        # Seed specific skills to employees
        # Dev 1: Python, PostgreSQL
        # Dev 2: React
        # Dev 3: Machine Learning, Docker, Python
        employee_skills = [
            (employees[0], ["Python", "PostgreSQL"], 4.5),
            (employees[1], ["React"], 4.8),
            (employees[2], ["Machine Learning", "Docker", "Python"], 3.9)
        ]

        for emp, s_names, prof in employee_skills:
            for s_name in s_names:
                res = await db.execute(select(Skill).where(Skill.name == s_name))
                skill = res.scalar_one()
                
                res2 = await db.execute(select(UserSkill).where(UserSkill.user_id == emp.id, UserSkill.skill_id == skill.id))
                if not res2.scalar_one_or_none():
                    db.add(UserSkill(user_id=emp.id, skill_id=skill.id, proficiency=prof, confidence_score=0.9, base_source="seed"))
        await db.commit()

        print("Seeding new Target with Tasks and relational skills...")
        target = Target(
            title="Q3 Enterprise AI Rollout",
            description="Launch the new Enterprise V2 features",
            manager_id=admin.id,
        )
        db.add(target)
        await db.flush()
        
        target_skills = ["Python", "Machine Learning", "React"]
        for s in target_skills:
            db.add(TargetRequiredSkill(target_id=target.id, skill_name=s))

        task1 = Task(
            target_id=target.id,
            title="Build Auto-Assigner Logic",
            description="Use Ollama or Gemini to assign users",
            status="pending"
        )
        db.add(task1)
        await db.flush()
        db.add(TaskRequiredSkill(task_id=task1.id, skill_name="Python"))
        db.add(TaskRequiredSkill(task_id=task1.id, skill_name="Machine Learning"))

        task2 = Task(
            target_id=target.id,
            title="Develop Master Control UI",
            description="React frontend for selecting AI models",
            status="pending"
        )
        db.add(task2)
        await db.flush()
        db.add(TaskRequiredSkill(task_id=task2.id, skill_name="React"))

        await db.commit()
        print("Database V2 Seed Complete! Added target and tasks with relational skills.")

if __name__ == "__main__":
    asyncio.run(seed())
