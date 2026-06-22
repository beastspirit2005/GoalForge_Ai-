import asyncio
import random
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.models.user import User
from app.models.role import UserRole
from app.models.skill import Skill, UserSkill
from app.models.target import Target, Task, TargetRequiredSkill, TaskRequiredSkill
from app.core.security import hash_password
from sqlalchemy import select

DEPARTMENTS = ["Engineering", "Product", "Sales", "Marketing", "Customer Support"]

SKILL_NAMES = ["Python", "React", "PostgreSQL", "Node.js", "TypeScript", "AWS", "Figma", "SEO", "Salesforce", "Communication", "Leadership", "Data Analysis", "Go", "Docker", "Kubernetes"]

RESUMES = [
    "Senior Software Engineer with 8 years of experience building scalable microservices in Python and Go. Expert in AWS, Docker, and Kubernetes.",
    "Frontend Developer specialized in React and TypeScript. Passionate about UI/UX and accessibility. 4 years of experience.",
    "Product Manager with a strong technical background. Certified Scrum Master. Led cross-functional teams to deliver 5 major product launches.",
    "Marketing Specialist focusing on SEO and content strategy. Increased organic traffic by 150% in the last year.",
    "Sales Executive with a track record of exceeding quotas by 20% consistently. Expert in Salesforce and B2B negotiation.",
    "Data Analyst proficient in Python and SQL. Built predictive models that improved customer retention by 15%.",
    "DevOps Engineer with deep expertise in CI/CD pipelines, Kubernetes, and Terraform. Reduced deployment time by 40%.",
    "Customer Support Lead managing a team of 15. Improved CSAT score from 85% to 98% in six months.",
    "Backend Engineer passionate about database optimization and API design. Heavily experienced with PostgreSQL and Node.js.",
    "UX/UI Designer with a portfolio of award-winning web applications. Expert in Figma and user research."
]

async def seed_team():
    async with async_session() as db:
        print("Ensuring skills exist...")
        skill_ids = {}
        for s_name in SKILL_NAMES:
            res = await db.execute(select(Skill).where(Skill.name == s_name))
            skill = res.scalar_one_or_none()
            if not skill:
                skill = Skill(name=s_name)
                db.add(skill)
                await db.flush()
            skill_ids[s_name] = skill.id
        
        await db.commit()

        print("Creating 5 Managers...")
        managers = []
        for i in range(1, 6):
            dept = DEPARTMENTS[i % len(DEPARTMENTS)]
            resume = random.choice(RESUMES)
            manager = User(
                name=f"Demo Manager {i}",
                email=f"demo_manager{i}@goalforge.ai",
                password_hash=hash_password("manager"),
                role=UserRole.MANAGER.value,
                department=dept,
                is_active=True,
                is_approved=True,
                experience_years=random.randint(5, 15),
                experience_summary=resume,
                resume_text_encrypted=f"{resume}\n\nEXPERIENCE:\nVarious roles in {dept}\n\nSKILLS:\nLeadership, Management, {random.choice(SKILL_NAMES)}".encode("utf-8")
            )
            db.add(manager)
            managers.append(manager)
        
        await db.commit()
        for m in managers:
            await db.refresh(m)

        print("Creating 10 Employees...")
        employees = []
        for i in range(1, 11):
            manager = random.choice(managers)
            dept = manager.department
            resume = random.choice(RESUMES)
            employee = User(
                name=f"Demo Employee {i}",
                email=f"demo_employee{i}@goalforge.ai",
                password_hash=hash_password("employee"),
                role=UserRole.EMPLOYEE.value,
                department=dept,
                manager_id=manager.id,
                is_active=True,
                is_approved=True,
                experience_years=random.randint(1, 8),
                experience_summary=resume,
                resume_text_encrypted=f"{resume}\n\nEXPERIENCE:\nWorker in {dept}\n\nSKILLS:\n{random.choice(SKILL_NAMES)}, {random.choice(SKILL_NAMES)}".encode("utf-8")
            )
            db.add(employee)
            employees.append(employee)

        await db.commit()
        for e in employees:
            await db.refresh(e)

        print("Assigning Skills to Employees...")
        for employee in employees:
            # Assign 2-4 random skills
            emp_skills = random.sample(SKILL_NAMES, random.randint(2, 4))
            for s_name in emp_skills:
                db.add(UserSkill(
                    user_id=employee.id,
                    skill_id=skill_ids[s_name],
                    proficiency=random.uniform(2.0, 5.0),
                    confidence_score=random.uniform(0.5, 0.95),
                    base_source="resume_parsing"
                ))
        
        await db.commit()

        print("Creating Targets and Tasks for Managers...")
        for manager in managers:
            # 1-2 targets per manager
            for t_idx in range(random.randint(1, 2)):
                target = Target(
                    title=f"{manager.department} Initiative Q3 - {t_idx}",
                    description=f"Strategic goal for {manager.department}",
                    manager_id=manager.id,
                    status="active",
                    progress=random.uniform(0.0, 1.0)
                )
                db.add(target)
                await db.flush()

                # Add some required skills
                for s_name in random.sample(SKILL_NAMES, random.randint(1, 3)):
                    db.add(TargetRequiredSkill(target_id=target.id, skill_name=s_name))

                # Create 2-4 tasks for this target
                for tk_idx in range(random.randint(2, 4)):
                    # Assign to one of the manager's employees
                    team = [e for e in employees if e.manager_id == manager.id]
                    assignee = random.choice(team) if team else None

                    task = Task(
                        target_id=target.id,
                        title=f"Implementation phase {tk_idx}",
                        description=f"Task detail for phase {tk_idx}",
                        assigned_to=assignee.id if assignee else None,
                        status=random.choice(["pending", "in_progress", "completed"]),
                        progress=random.uniform(0.0, 1.0)
                    )
                    db.add(task)
                    await db.flush()

                    for s_name in random.sample(SKILL_NAMES, random.randint(1, 2)):
                        db.add(TaskRequiredSkill(task_id=task.id, skill_name=s_name))

        await db.commit()
        print("Database successfully seeded with 5 managers and 10 employees, including resumes, skills, and tasks!")

if __name__ == '__main__':
    asyncio.run(seed_team())
