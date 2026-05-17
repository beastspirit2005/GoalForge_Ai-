"""Seed the database with demo data."""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Change working directory to backend so SQLite path resolves correctly
os.chdir(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.models import *  # noqa: F401, F403 — ensure all models registered
from app.core.database import async_session, create_tables
from app.core.security import hash_password
from app.models.user import User
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.checkin import Checkin
from app.models.audit_log import AuditLog


async def seed():
    print("🔧 Creating tables...")
    await create_tables()

    async with async_session() as db:
        # Check if already seeded
        from sqlalchemy import select, func
        count = await db.scalar(select(func.count()).select_from(User))
        if count and count > 0:
            print(f"⚠️  Database already has {count} users. Skipping seed.")
            print("   Delete goalforge.db and re-run to reset.")
            return

        pw = hash_password("password123")

        # ── Users ────────────────────────────────────────────────
        print("   → Adding demo users...")
        users_data = [
            {"id": 1, "name": "Aarav Mehta", "email": "employee@goalforge.ai", "phone_number": "+1234567890", "password_hash": pw, "role": UserRole.EMPLOYEE.value, "department": "People Ops", "manager_id": 2},
            {"id": 2, "name": "Priya Nair", "email": "manager@goalforge.ai", "phone_number": "+1987654321", "password_hash": pw, "role": UserRole.MANAGER.value, "department": "People Ops", "manager_id": 3},
            {"id": 3, "name": "Rohan Kapoor", "email": "admin@goalforge.ai", "phone_number": "+1122334455", "password_hash": pw, "role": UserRole.ADMIN.value, "department": "Operations", "manager_id": None},
            {"id": 4, "name": "Neha Rao", "email": "neha.rao@goalforge.ai", "phone_number": None, "password_hash": pw, "role": UserRole.EMPLOYEE.value, "department": "Engineering", "manager_id": 2},
            {"id": 5, "name": "Kabir Singh", "email": "kabir.s@goalforge.ai", "phone_number": None, "password_hash": pw, "role": UserRole.EMPLOYEE.value, "department": "Sales", "manager_id": 2},
        ]
        users = [User(**data) for data in users_data]
        for u in users:
            db.add(u)
        await db.flush()

        for u in [users[0], users[3], users[4]]:
            u.manager_id = users[1].id

        # ── Goals ────────────────────────────────────────────────
        goals = [
            Goal(
                user_id=users[0].id,
                title="Launch AI onboarding playbook",
                description="Publish onboarding journey and reduce ramp time by 20%",
                target="Reduce ramp time by 20%",
                weightage=30.0,
                deadline="2026-06-28",
                status="approved",
                progress=72,
                risk="Low",
                ai_recommendation="Record the first three mentor sessions this week and convert repeat questions into checklist items.",
            ),
            Goal(
                user_id=users[3].id,
                title="Improve sprint delivery predictability",
                description="Raise planned-to-done ratio from 61% to 82%",
                target="82% planned-to-done ratio",
                weightage=35.0,
                deadline="2026-07-12",
                status="approved",
                progress=46,
                risk="Medium",
                ai_recommendation="Split the two largest workstreams before the next planning meeting and flag dependency owners early.",
            ),
            Goal(
                user_id=users[4].id,
                title="Grow enterprise pipeline",
                description="Add 35 qualified enterprise opportunities",
                target="35 qualified opportunities",
                weightage=40.0,
                deadline="2026-06-30",
                status="pending",
                progress=31,
                risk="High",
                ai_recommendation="Prioritize accounts with active procurement signals and schedule manager review for stalled prospects.",
            ),
        ]
        for g in goals:
            db.add(g)
        await db.flush()

        # ── Milestones ───────────────────────────────────────────
        milestones = [
            Milestone(goal_id=goals[0].id, title="Map first-week employee journey", due_date="Week 1", is_completed=True),
            Milestone(goal_id=goals[0].id, title="Draft AI FAQ prompts", due_date="Week 2", is_completed=True),
            Milestone(goal_id=goals[0].id, title="Pilot with 6 new hires", due_date="Week 3", is_completed=False),
            Milestone(goal_id=goals[0].id, title="Measure ramp-time delta", due_date="Week 4", is_completed=False),
            Milestone(goal_id=goals[1].id, title="Audit spillover themes", due_date="Week 1", is_completed=True),
            Milestone(goal_id=goals[1].id, title="Create dependency board", due_date="Week 2", is_completed=False),
            Milestone(goal_id=goals[1].id, title="Run two planning calibration sessions", due_date="Week 3", is_completed=False),
            Milestone(goal_id=goals[1].id, title="Publish predictability report", due_date="Week 4", is_completed=False),
            Milestone(goal_id=goals[2].id, title="Refresh ICP account list", due_date="Week 1", is_completed=True),
            Milestone(goal_id=goals[2].id, title="Launch procurement-signal outreach", due_date="Week 2", is_completed=False),
            Milestone(goal_id=goals[2].id, title="Book 18 discovery calls", due_date="Week 3", is_completed=False),
            Milestone(goal_id=goals[2].id, title="Convert 9 opportunities", due_date="Week 4", is_completed=False),
        ]
        for m in milestones:
            db.add(m)

        # ── Check-ins ────────────────────────────────────────────
        checkins = [
            Checkin(goal_id=goals[0].id, user_id=users[0].id, quarter="Q2-2026", actual_achievement=72, progress_status="On Track", notes="Completed AI FAQ prompts. Piloting next week."),
            Checkin(goal_id=goals[1].id, user_id=users[3].id, quarter="Q2-2026", actual_achievement=46, progress_status="Needs Review", notes="Dependency board in progress. Need manager input."),
            Checkin(goal_id=goals[2].id, user_id=users[4].id, quarter="Q2-2026", actual_achievement=31, progress_status="At Risk", notes="Discovery calls not converting fast enough."),
        ]
        for c in checkins:
            db.add(c)

        # ── Audit Logs ──────────────────────────────────────────
        audit_logs = [
            AuditLog(user_id=users[0].id, action="goal_created", entity_type="goal", entity_id=goals[0].id),
            AuditLog(user_id=users[1].id, action="goal_approved", entity_type="goal", entity_id=goals[0].id),
            AuditLog(user_id=users[3].id, action="goal_created", entity_type="goal", entity_id=goals[1].id),
            AuditLog(user_id=users[1].id, action="goal_approved", entity_type="goal", entity_id=goals[1].id),
            AuditLog(user_id=users[4].id, action="goal_created", entity_type="goal", entity_id=goals[2].id),
        ]
        for a in audit_logs:
            db.add(a)

        await db.commit()

        print("✅ Database seeded successfully!")
        print(f"   → {len(users)} users")
        print(f"   → {len(goals)} goals")
        print(f"   → {len(milestones)} milestones")
        print(f"   → {len(checkins)} check-ins")
        print(f"   → {len(audit_logs)} audit logs")
        print()
        print("   Login credentials:")
        print("   ┌─────────────────────────────────────────┐")
        print("   │ employee@goalforge.ai / password123     │")
        print("   │ manager@goalforge.ai  / password123     │")
        print("   │ admin@goalforge.ai    / password123     │")
        print("   └─────────────────────────────────────────┘")


if __name__ == "__main__":
    asyncio.run(seed())
