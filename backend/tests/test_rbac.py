import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.user import User

client = TestClient(app)


def test_employee_cannot_access_admin_users():
    """Verify that a standard employee receives HTTP 403 Forbidden on admin endpoints."""
    # Override Auth dependency to return a standard employee
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, name="Employee User", role="employee", email="employee@example.com"
    )
    
    response = client.get("/admin/users")
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"] or "not allowed" in response.json()["detail"]


def test_admin_can_access_admin_users():
    """Verify that an administrator receives HTTP 200 OK on admin endpoints."""
    # Override Auth dependency to return an administrator
    app.dependency_overrides[get_current_user] = lambda: User(
        id=11, name="Admin User", role="admin", email="admin@example.com"
    )
    
    response = client.get("/admin/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_employee_cannot_approve_goals():
    """Verify that a standard employee receives HTTP 403 Forbidden on goal approvals."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=10, name="Employee User", role="employee", email="employee@example.com"
    )
    
    response = client.post(
        "/manager/goals/1/approve",
        json={"action": "approve", "comment": "Approved by standard user"}
    )
    assert response.status_code == 403


def test_manager_can_approve_goals():
    """Verify that a manager can access goal approval routes (will hit 404 since goal 99999 doesn't exist, which is a 4xx success boundary)."""
    app.dependency_overrides[get_current_user] = lambda: User(
        id=12, name="Manager User", role="manager", email="manager@example.com"
    )
    
    response = client.post(
        "/manager/goals/99999/approve",
        json={"action": "approve", "comment": "Approved"}
    )
    # The role check passes (manager role allowed), leading to a Goal Not Found (404) rather than Forbidden (403)
    assert response.status_code == 404
