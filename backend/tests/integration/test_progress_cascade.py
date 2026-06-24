"""
Integration tests for GoalForge AI — Progress Cascade & Multi-Assignee System.
Tests: Milestone → Goal → Task → Target cascade, goal auto-completion,
       task multi-assignee, assignment authorization, and notification dispatch.

Run with: pytest backend/tests/integration/test_progress_cascade.py -v
"""

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.database import Base
from app.models.user import User
from app.models.goal import Goal
from app.models.target import Target, Task, TaskAssignee
from app.models.milestone import Milestone
from app.models.role import GoalStatus, UserRole
from app.core.security import hash_password


# ──────────────────────────────────────────────
# TEST DATABASE SETUP (in-memory SQLite)
# ──────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    """Create all tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db():
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

async def make_user(db: AsyncSession, name: str, role: str = "employee", manager_id: int | None = None) -> User:
    user = User(
        name=name,
        email=f"{name.lower().replace(' ', '.')}@test.com",
        password_hash=hash_password("Test@1234"),
        role=role,
        is_active=True,
        is_approved=True,
        manager_id=manager_id,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def make_target(db: AsyncSession, owner: User) -> Target:
    target = Target(title="Test Target", description="Integration test target", manager_id=owner.id)
    db.add(target)
    await db.flush()
    await db.refresh(target)
    return target


async def make_task(db: AsyncSession, target: Target, assigned_to: int | None = None) -> Task:
    task = Task(
        target_id=target.id,
        title="Test Task",
        description="Integration test task",
        assigned_to=assigned_to,
        status="pending",
        progress=0.0,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def make_goal(db: AsyncSession, user: User, task: Task | None = None) -> Goal:
    goal = Goal(
        user_id=user.id,
        title="Test Goal",
        target="Achieve X",
        uom="units",
        weightage=20.0,
        status=GoalStatus.APPROVED.value,
        progress=0.0,
        task_id=task.id if task else None,
    )
    db.add(goal)
    await db.flush()
    await db.refresh(goal)
    return goal


async def make_milestone(db: AsyncSession, goal: Goal, title: str = "Milestone", done: bool = False) -> Milestone:
    ms = Milestone(goal_id=goal.id, title=title, is_completed=done)
    db.add(ms)
    await db.flush()
    await db.refresh(ms)
    return ms


# ──────────────────────────────────────────────
# TEST SUITE
# ──────────────────────────────────────────────

class TestProgressCascade:
    """Tests for the milestone → goal → task → target cascade chain."""

    @pytest.mark.asyncio
    async def test_milestone_toggle_updates_goal_progress(self, db: AsyncSession):
        """Completing milestones should proportionally increase goal progress."""
        manager = await make_user(db, "Manager One", role="manager")
        employee = await make_user(db, "Alice Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)

        ms1 = await make_milestone(db, goal, "Step 1")
        ms2 = await make_milestone(db, goal, "Step 2")
        ms3 = await make_milestone(db, goal, "Step 3")
        await db.flush()

        from app.services.milestone_service import toggle_milestone
        from app.services.goal_service import get_goal_by_id

        # Toggle 1 of 3 milestones
        await toggle_milestone(db, ms1, employee)
        await db.flush()
        refreshed_goal = await get_goal_by_id(db, goal.id)
        assert refreshed_goal.progress == pytest.approx(33.3, abs=1.0)

        # Toggle 2nd milestone — should be ~66.7%
        ms2_fresh = (await db.execute(select(Milestone).where(Milestone.id == ms2.id))).scalar_one()
        await toggle_milestone(db, ms2_fresh, employee)
        await db.flush()
        refreshed_goal = await get_goal_by_id(db, goal.id)
        assert refreshed_goal.progress == pytest.approx(66.7, abs=1.0)

    @pytest.mark.asyncio
    async def test_all_milestones_done_auto_completes_goal(self, db: AsyncSession):
        """When all milestones are ticked, goal status should auto-set to 'completed'."""
        manager = await make_user(db, "Manager Two", role="manager")
        employee = await make_user(db, "Bob Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)

        ms1 = await make_milestone(db, goal, "Task A")
        ms2 = await make_milestone(db, goal, "Task B")
        await db.flush()

        from app.services.milestone_service import toggle_milestone
        from app.services.goal_service import get_goal_by_id

        await toggle_milestone(db, ms1, employee)
        await db.flush()
        ms2_fresh = (await db.execute(select(Milestone).where(Milestone.id == ms2.id))).scalar_one()
        await toggle_milestone(db, ms2_fresh, employee)
        await db.flush()

        refreshed_goal = await get_goal_by_id(db, goal.id)
        assert refreshed_goal.progress == 100.0
        assert refreshed_goal.status == "completed"

    @pytest.mark.asyncio
    async def test_unchecking_milestone_reverts_goal_from_completed(self, db: AsyncSession):
        """Unchecking a milestone on a completed goal should revert it to 'approved'."""
        manager = await make_user(db, "Manager Three", role="manager")
        employee = await make_user(db, "Carol Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)
        goal.status = "completed"
        goal.progress = 100.0
        await db.flush()

        ms1 = await make_milestone(db, goal, "Done Step", done=True)
        await db.flush()

        from app.services.milestone_service import toggle_milestone
        from app.services.goal_service import get_goal_by_id

        ms1_fresh = (await db.execute(select(Milestone).where(Milestone.id == ms1.id))).scalar_one()
        await toggle_milestone(db, ms1_fresh, employee)
        await db.flush()

        refreshed_goal = await get_goal_by_id(db, goal.id)
        assert refreshed_goal.progress == 0.0
        assert refreshed_goal.status == "approved"

    @pytest.mark.asyncio
    async def test_goal_progress_cascades_to_task(self, db: AsyncSession):
        """Goal progress changes should flow up to Task.progress."""
        manager = await make_user(db, "Manager Four", role="manager")
        employee = await make_user(db, "Dave Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)

        ms1 = await make_milestone(db, goal, "Step 1")
        ms2 = await make_milestone(db, goal, "Step 2")
        await db.flush()

        from app.services.milestone_service import toggle_milestone

        await toggle_milestone(db, ms1, employee)
        await db.flush()

        task_fresh = (await db.execute(select(Task).where(Task.id == task.id))).scalar_one()
        assert task_fresh.progress == pytest.approx(50.0, abs=1.0)

    @pytest.mark.asyncio
    async def test_task_progress_cascades_to_target(self, db: AsyncSession):
        """Task progress changes should flow up to Target.progress."""
        manager = await make_user(db, "Manager Five", role="manager")
        employee = await make_user(db, "Eve Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)

        ms1 = await make_milestone(db, goal, "Step 1")
        ms2 = await make_milestone(db, goal, "Step 2")
        await db.flush()

        from app.services.milestone_service import toggle_milestone

        await toggle_milestone(db, ms1, employee)
        ms2_fresh = (await db.execute(select(Milestone).where(Milestone.id == ms2.id))).scalar_one()
        await toggle_milestone(db, ms2_fresh, employee)
        await db.flush()

        target_fresh = (await db.execute(select(Target).where(Target.id == target.id))).scalar_one()
        assert target_fresh.progress == pytest.approx(100.0, abs=1.0)


class TestMultiAssigneeTask:
    """Tests for the TaskAssignee many-to-many task assignment system."""

    @pytest.mark.asyncio
    async def test_multiple_employees_assignable_to_task(self, db: AsyncSession):
        """A task should support multiple employees via the junction table."""
        manager = await make_user(db, "Manager Multi", role="manager")
        emp1 = await make_user(db, "Employee One", manager_id=manager.id)
        emp2 = await make_user(db, "Employee Two", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target)

        db.add(TaskAssignee(task_id=task.id, user_id=emp1.id))
        db.add(TaskAssignee(task_id=task.id, user_id=emp2.id))
        await db.flush()

        result = await db.execute(
            select(TaskAssignee).where(TaskAssignee.task_id == task.id)
        )
        assignees = result.scalars().all()
        assignee_ids = {a.user_id for a in assignees}
        assert emp1.id in assignee_ids
        assert emp2.id in assignee_ids

    @pytest.mark.asyncio
    async def test_only_assigned_employee_can_create_goal_under_task(self, db: AsyncSession):
        """An employee NOT assigned to a task should get 403 when creating a goal under it."""
        from fastapi import HTTPException
        from app.schemas.goal_schema import GoalCreate
        from app.services.goal_service import create_goal

        manager = await make_user(db, "Manager Auth", role="manager")
        assigned_emp = await make_user(db, "Assigned Emp", manager_id=manager.id)
        unassigned_emp = await make_user(db, "Unassigned Emp", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=assigned_emp.id)

        goal_data = GoalCreate(
            title="Test Auth Goal",
            target="Some target",
            uom="units",
            weightage=20.0,
            task_id=task.id,
        )

        # Assigned employee should succeed
        goal = await create_goal(db, assigned_emp, goal_data)
        assert goal.id is not None

        # Unassigned employee should fail with 403
        goal_data2 = GoalCreate(
            title="Unauthorized Goal",
            target="Some target",
            uom="units",
            weightage=20.0,
            task_id=task.id,
        )
        with pytest.raises(HTTPException) as exc_info:
            await create_goal(db, unassigned_emp, goal_data2)
        assert exc_info.value.status_code == 403

    @pytest.mark.asyncio
    async def test_manager_can_create_goal_under_any_task(self, db: AsyncSession):
        """Managers should always be allowed to create goals under any task."""
        from app.schemas.goal_schema import GoalCreate
        from app.services.goal_service import create_goal

        manager = await make_user(db, "Manager Bypass", role="manager")
        target = await make_target(db, manager)
        task = await make_task(db, target)  # No assignee

        goal_data = GoalCreate(
            title="Manager Goal",
            target="Manager target",
            uom="count",
            weightage=20.0,
            task_id=task.id,
        )
        goal = await create_goal(db, manager, goal_data)
        assert goal.id is not None
        assert goal.task_id == task.id


class TestUpdateGoalCascade:
    """Tests that update_goal properly cascades when progress changes."""

    @pytest.mark.asyncio
    async def test_update_goal_progress_cascades_to_task(self, db: AsyncSession):
        """Manually updating goal progress should cascade up to the task."""
        from app.schemas.goal_schema import GoalUpdate
        from app.services.goal_service import update_goal

        manager = await make_user(db, "Cascade Manager", role="manager")
        employee = await make_user(db, "Cascade Employee", manager_id=manager.id)
        target = await make_target(db, manager)
        task = await make_task(db, target, assigned_to=employee.id)
        goal = await make_goal(db, employee, task=task)
        await db.flush()

        update_data = GoalUpdate(progress=75.0)
        await update_goal(db, goal, update_data, manager)
        await db.flush()

        task_fresh = (await db.execute(select(Task).where(Task.id == task.id))).scalar_one()
        assert task_fresh.progress == pytest.approx(75.0, abs=1.0)


class TestLastLoginAt:
    """Tests that last_login_at is correctly persisted."""

    @pytest.mark.asyncio
    async def test_last_login_at_set_on_otp_login(self, db: AsyncSession):
        """verify_otp_and_login should set last_login_at on success."""
        import secrets
        from datetime import datetime, timedelta, timezone
        from app.services.auth_service import verify_otp_and_login

        user = await make_user(db, "OTP User")
        code = f"{secrets.randbelow(1_000_000):06d}"
        user.otp_code = code
        user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        user.otp_failed_attempts = 0
        await db.flush()

        logged_in = await verify_otp_and_login(db, user.email, code)
        assert logged_in.last_login_at is not None
        # Should be within the last 5 seconds
        now = datetime.now(timezone.utc)
        diff = (now - logged_in.last_login_at.replace(tzinfo=timezone.utc)).total_seconds()
        assert diff < 5
