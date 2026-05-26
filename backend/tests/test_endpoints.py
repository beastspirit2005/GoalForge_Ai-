import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.user import User

def mock_get_current_user():
    # Return a dummy active User instance to satisfyDepends(get_current_user)
    return User(id=1, name="Test User", role="employee", email="employee@goalforge.ai")

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

client = TestClient(app)


def test_health_endpoint():
    """Verify that the enhanced /health endpoint runs self-checks correctly."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "error"]
    assert data["service"] == "goalforge-api"
    assert "database" in data
    assert "memory_usage_mb" in data


def test_metrics_endpoint():
    """Verify that the /metrics endpoint serves Prometheus compatible metrics."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "goalforge_http_requests_total" in response.text


def test_tracing_header():
    """Verify that the tracing middleware injects X-Trace-Id header successfully."""
    response = client.get("/health")
    assert "X-Trace-Id" in response.headers
    trace_id = response.headers["X-Trace-Id"]
    assert len(trace_id) > 0


def test_rate_limiting_ai():
    """Verify that RateLimitMiddleware triggers HTTP 429 after 10 requests to AI chat routes."""
    from app.middleware.rate_limit import AI_REQUESTS
    AI_REQUESTS.clear()
    
    responses = []
    # Make 12 requests. The 11th and 12th should be blocked with 429
    for _ in range(12):
        res = client.post(
            "/ai/copilot",
            json={"query": "Hello", "context": "Mock context to bypass DB", "provider": "fallback"},
            headers={"Authorization": "Bearer test_token_dummy"},
        )
        responses.append(res)
        
    status_codes = [r.status_code for r in responses]
    
    # Clear again immediately to avoid blocking other tests
    AI_REQUESTS.clear()
    
    assert 429 in status_codes
    # Get all indices where status is 429
    indices = [i for i, code in enumerate(status_codes) if code == 429]
    assert len(indices) > 0
    assert 10 in indices or 11 in indices


def test_ai_copilot_fallback_mocked():
    """Verify that the AI Copilot fallback rules return the correct local advice."""
    response = client.post(
        "/ai/copilot",
        json={"query": "risk advice", "context": "Mock context to bypass DB", "provider": "fallback"},
        headers={"Authorization": "Bearer test_token_dummy"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "Offline Fallback Advice" in data["response"]
    assert data["source"] == "fallback"

