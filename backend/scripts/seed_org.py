import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.core.security import hash_password

async def seed_org():
    async with async_session() as db:
        print("Starting seeding process...")

        # Find existing super_admin
        res = await db.execute(select(User).where(User.role == "super_admin"))
        super_admin = res.scalars().first()
        if super_admin:
            print(f"Found existing Super Admin: {super_admin.email}")
        else:
            print("No Super Admin found. Creating one...")
            super_admin = User(
                name="Harshit Sharma",
                email="harshit2005sharma@gmail.com",
                password_hash=hash_password("password123"),
                role="super_admin",
                department="Management",
                is_active=True,
                is_approved=True
            )
            db.add(super_admin)
            await db.commit()
            await db.refresh(super_admin)
            print("Created Super Admin: harshit2005sharma@gmail.com")

        password = hash_password("password123")
        
        # Create 2 Admins
        admins = []
        for i in range(1, 3):
            email = f"admin{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            if not res.scalars().first():
                u = User(
                    name=f"Admin {i}",
                    email=email,
                    password_hash=password,
                    role="admin",
                    department="Executive",
                    is_active=True,
                    is_approved=True
                )
                db.add(u)
                admins.append(u)
        
        await db.commit()
        for a in admins: await db.refresh(a)
        print(f"Created {len(admins)} new Admins.")

        # Create 4 Managers
        managers = []
        for i in range(1, 5):
            email = f"manager{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            if not res.scalars().first():
                u = User(
                    name=f"Manager {i}",
                    email=email,
                    password_hash=password,
                    role="manager",
                    department=f"Department {i}",
                    is_active=True,
                    is_approved=True
                )
                db.add(u)
                managers.append(u)

        await db.commit()
        for m in managers: await db.refresh(m)
        print(f"Created {len(managers)} new Managers.")

        # Re-query all managers in case they already existed
        res = await db.execute(select(User).where(User.role == "manager"))
        all_managers = res.scalars().all()

        if not all_managers:
            print("No managers available to assign employees to.")
            return

        # Create 10 Employees
        employees = []
        for i in range(1, 11):
            email = f"employee{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            if not res.scalars().first():
                mgr = all_managers[i % len(all_managers)]
                u = User(
                    name=f"Employee {i}",
                    email=email,
                    password_hash=password,
                    role="employee",
                    department=mgr.department,
                    manager_id=mgr.id,
                    is_active=True,
                    is_approved=True,
                    experience_years=i % 10 + 1,
                    experience_summary=f"Experienced professional with {i % 10 + 1} years of history."
                )
                db.add(u)
                employees.append(u)

        await db.commit()
        for e in employees: await db.refresh(e)
        print(f"Created {len(employees)} new Employees.")

        # Re-query all employees
        res = await db.execute(select(User).where(User.role == "employee"))
        all_employees = res.scalars().all()

        # Create basic skills if they don't exist
        skill_names = ["Python", "React", "TypeScript", "SQL", "Machine Learning", "Project Management"]
        skills = []
        for s_name in skill_names:
            res = await db.execute(select(Skill).where(Skill.name == s_name))
            skill = res.scalars().first()
            if not skill:
                skill = Skill(name=s_name)
                db.add(skill)
            skills.append(skill)
            
        await db.commit()
        for s in skills: await db.refresh(s)

        # Assign skills to employees
        new_user_skills = 0
        for i, emp in enumerate(all_employees):
            # Assign 2 random skills to each employee based on their index
            s1 = skills[i % len(skills)]
            s2 = skills[(i + 1) % len(skills)]
            
            for sk in [s1, s2]:
                res = await db.execute(select(UserSkill).where(UserSkill.user_id == emp.id, UserSkill.skill_id == sk.id))
                if not res.scalars().first():
                    db.add(UserSkill(
                        user_id=emp.id,
                        skill_id=sk.id,
                        proficiency=0.8,
                        confidence_score=0.85,
                        base_source="system_seed"
                    ))
                    new_user_skills += 1

        await db.commit()
        print(f"Assigned {new_user_skills} new skills to employees.")
        print("Database population complete!")
        print("Password for all generated accounts is: password123")

if __name__ == "__main__":
    asyncio.run(seed_org())
