import pytest
from fastapi.testclient import TestClient
from app.real_main import app
from app.core.auth import get_current_user, require_critical_otp
from app.models.user import User
from app.models.role import UserRole

client = TestClient(app)

def test_copilot_context_super_admin_mocked():
    # Setup mock user
    mock_super_admin = User(
        id=999,
        name="Mock Super Admin",
        email="mock_sa@goalforge.ai",
        role=UserRole.SUPER_ADMIN.value,
        is_active=True,
        is_approved=True
    )
    
    app.dependency_overrides[get_current_user] = lambda: mock_super_admin
    
    try:
        response = client.get("/ai/copilot-context")
        assert response.status_code == 200
        data = response.json()
        assert "context" in data
        assert "role" in data
        assert data["role"] == "super_admin"
        assert "GOD MODE SYSTEM OVERVIEW" in data["context"]
        assert "RISK RADAR & BURNOUT ALERTS" in data["context"]
        assert "ORGANIZATIONAL TALENT" in data["context"]
        assert "SECURITY AUDIT" in data["context"]
    finally:
        if get_current_user in app.dependency_overrides:
            del app.dependency_overrides[get_current_user]


def test_execute_action_super_admin_mocked():
    mock_super_admin = User(
        id=999,
        name="Mock Super Admin",
        email="mock_sa@goalforge.ai",
        role=UserRole.SUPER_ADMIN.value,
        is_active=True,
        is_approved=True
    )
    
    app.dependency_overrides[get_current_user] = lambda: mock_super_admin
    app.dependency_overrides[require_critical_otp] = lambda: mock_super_admin
    
    try:
        response = client.post(
            "/ai/execute-action",
            json={"action": "disable_inactive_users", "params": {"days": 90}}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "Successfully disabled" in data["message"]
    finally:
        if get_current_user in app.dependency_overrides:
            del app.dependency_overrides[get_current_user]
        if require_critical_otp in app.dependency_overrides:
            del app.dependency_overrides[require_critical_otp]
