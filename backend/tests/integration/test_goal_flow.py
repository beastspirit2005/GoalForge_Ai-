import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.core.auth import get_current_user
from app.core.database import async_session
from app.models.user import User
from app.models.goal import Goal
from app.models.audit_log import AuditLog
from app.models.role import GoalStatus

client = TestClient(app)

@pytest.mark.asyncio
async def test_integration_goal_lifecycle_flow():
    """Integration test verifying a full goal creation -> submission -> manager approval -> audit logging flow."""
    
    # 1. Setup the testing users (employee Aarav Mehta managed by Priya Nair)
    async with async_session() as db:
        # Create manager
        manager = User(
            id=2,
            name="Priya Nair",
            email="manager@goalforge.ai",
            password_hash="$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy",
            role="manager",
            department="Engineering",
            is_active=True
        )
        # Create employee
        employee = User(
            id=1,
            name="Aarav Mehta",
            email="employee@goalforge.ai",
            password_hash="$2b$12$zA76FnlxRcjUJX1De7Qh8.8T2s/A83X8KM91K0Xf/RPoR66TH84Jy",
            role="employee",
            department="People Ops",
            manager_id=2,
            is_active=True
        )
        db.add(manager)
        db.add(employee)
        await db.commit()

    # 2. Simulate the Employee: Override get_current_user dependency
    employee_instance = None
    async with async_session() as db:
        res = await db.execute(select(User).where(User.id == 1))
        employee_instance = res.scalar_one()
    
    app.dependency_overrides[get_current_user] = lambda: employee_instance

    # 3. Create the Goal as the Employee via API
    goal_payload = {
        "title": "Build CI/CD Pipeline",
        "description": "Establish backend CI/CD automated test integrations",
        "target": "100% automated test coverage",
        "uom": "percent",
        "weightage": 45.0,
        "deadline": "2026-12-31"
    }
    
    response = client.post("/goals/", json=goal_payload)
    assert response.status_code == 201
    created_goal = response.json()
    assert created_goal["title"] == "Build CI/CD Pipeline"
    assert created_goal["status"] == "draft"
    goal_id = created_goal["id"]

    # 4. Submit the Goal as the Employee via API
    response = client.post(f"/goals/{goal_id}/submit")
    assert response.status_code == 200
    submitted_goal = response.json()
    assert submitted_goal["status"] == "pending"

    # 5. Simulate the Manager: Override get_current_user dependency
    manager_instance = None
    async with async_session() as db:
        res = await db.execute(select(User).where(User.id == 2))
        manager_instance = res.scalar_one()

    app.dependency_overrides[get_current_user] = lambda: manager_instance

    # 6. Approve the Goal as the Manager via API
    approval_payload = {
        "action": "approve",
        "comment": "Outstanding goal! High business value."
    }
    response = client.post(f"/manager/goals/{goal_id}/approve", json=approval_payload)
    assert response.status_code == 200
    approval_result = response.json()
    assert approval_result["status"] == "approved"

    # 7. Clean up overrides
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

    # 8. Verify the Audit Log captured all three actions and has a robust MD5 cryptographic chain
    async with async_session() as db:
        result = await db.execute(select(AuditLog).where(AuditLog.entity_id == goal_id).order_by(AuditLog.id.asc()))
        logs = result.scalars().all()
        
        actions = [log.action for log in logs]
        assert "goal_created" in actions
        assert "goal_submitted" in actions
        assert "goal_approved" in actions
        
        # Verify the chain integrity in detail
        for i, log in enumerate(logs):
            assert log.entry_hash is not None
            assert len(log.entry_hash) == 32
            if i == 0:
                assert log.prev_hash is None
            else:
                assert log.prev_hash == logs[i - 1].entry_hash
