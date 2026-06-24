import sys
import os
import asyncio
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.core.database import async_session
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.target import Target, Task, TaskAssignee
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.core.security import hash_password

async def seed_massive_data():
    async with async_session() as db:
        print("Starting massive seeding process...")
        password = hash_password("password123")
        
        # 1. Admins
        admins = []
        for i in range(1, 6):
            email = f"admin_pro_{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            u = res.scalars().first()
            if not u:
                u = User(
                    name=f"Admin Pro {i}",
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

        # 2. Managers
        departments = ["Engineering", "Sales", "Marketing", "HR", "Product"]
        managers = []
        for i in range(1, 16):
            email = f"manager_pro_{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            u = res.scalars().first()
            if not u:
                u = User(
                    name=f"Manager Pro {i}",
                    email=email,
                    password_hash=password,
                    role="manager",
                    department=departments[i % len(departments)],
                    is_active=True,
                    is_approved=True
                )
                db.add(u)
            managers.append(u)
        await db.commit()
        for m in managers: await db.refresh(m)

        # 3. Employees
        employees = []
        for i in range(1, 51):
            email = f"employee_pro_{i}@goalforge.ai"
            res = await db.execute(select(User).where(User.email == email))
            u = res.scalars().first()
            if not u:
                mgr = random.choice(managers)
                u = User(
                    name=f"Employee Pro {i}",
                    email=email,
                    password_hash=password,
                    role="employee",
                    department=mgr.department,
                    manager_id=mgr.id,
                    is_active=True,
                    is_approved=True,
                    experience_years=random.randint(1, 15),
                    experience_summary=f"Experienced professional in {mgr.department}"
                )
                db.add(u)
            employees.append(u)
        await db.commit()
        for e in employees: await db.refresh(e)
        
        # 4. Create Targets and Tasks
        for mgr in managers:
            # Check if manager already has targets
            res = await db.execute(select(Target).where(Target.manager_id == mgr.id))
            if res.scalars().first(): continue
            
            target = Target(
                title=f"Q3 Objective for {mgr.department}",
                description=f"Increase metrics for {mgr.department}",
                status="active",
                deadline=datetime.now() + timedelta(days=90),
                manager_id=mgr.id
            )
            db.add(target)
            await db.commit()
            await db.refresh(target)
            
            # Find employees under this manager
            mgr_employees = [e for e in employees if e.manager_id == mgr.id]
            if not mgr_employees: continue
            
            # Create a Task
            task = Task(
                target_id=target.id,
                title=f"Key Initiative {mgr.id}",
                description="Crucial initiative.",
                status="assigned",
                deadline=datetime.now() + timedelta(days=60),
                assigned_to=mgr_employees[0].id
            )
            db.add(task)
            await db.commit()
            await db.refresh(task)
            
            # Assign task to multiple employees
            assigned_subset = random.sample(mgr_employees, min(3, len(mgr_employees)))
            for emp in assigned_subset:
                db.add(TaskAssignee(task_id=task.id, user_id=emp.id))
            await db.commit()
            
            # Create goals for each assigned employee
            for emp in assigned_subset:
                goal = Goal(
                    user_id=emp.id,
                    task_id=task.id,
                    title=f"Goal for {emp.name}",
                    description="Individual contribution",
                    target="100.0",
                    uom="%",
                    weightage=10.0,
                    status="approved",
                    risk="Low"
                )
                db.add(goal)
                await db.commit()
                await db.refresh(goal)
                
                # Add a milestone
                m = Milestone(
                    goal_id=goal.id,
                    title=f"Phase 1 for {emp.name}",
                    due_date=datetime.now() + timedelta(days=15),
                    is_completed=False,
                    source="user"
                )
                db.add(m)
            await db.commit()
        
        print("Successfully populated considerable new data: 5 Admins, 15 Managers, 50 Employees, plus active Targets, Tasks, and Goals.")

if __name__ == "__main__":
    asyncio.run(seed_massive_data())
