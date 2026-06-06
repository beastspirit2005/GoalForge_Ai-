import os
import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import async_session
from app.models.user import User
from app.core.security import hash_password
from sqlalchemy import text, delete

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_and_seed_db():
    # Clean up test users synchronously via event loop run (since pytest-asyncio runs async tests)
    async def _setup():
        async with async_session() as db:
            # Clean up users to avoid conflicts
            await db.execute(text("DELETE FROM users WHERE email IN ('test_sec_emp@goalforge.ai');"))
            
            # Create a test employee
            test_user = User(
                id=9999,
                name="Security Test Employee",
                email="test_sec_emp@goalforge.ai",
                password_hash=hash_password("password123"),
                role="employee",
                department="QA",
                is_active=True,
                is_approved=True
            )
            await db.merge(test_user)
            await db.commit()
            
    asyncio.run(_setup())
    yield
    
    async def _cleanup():
        async with async_session() as db:
            await db.execute(text("DELETE FROM users WHERE email IN ('test_sec_emp@goalforge.ai');"))
            await db.commit()
    asyncio.run(_cleanup())


def test_request_otp_demo_mode_active():
    """Verify that request-otp returns the code in response body when DEMO_MODE is active."""
    os.environ["DEMO_MODE"] = "true"
    response = client.post("/auth/request-otp", json={"email": "test_sec_emp@goalforge.ai"})
    assert response.status_code == 200
    data = response.json()
    assert "Demo Mode" in data["message"]
    assert "Use code" in data["message"]


def test_request_otp_demo_mode_inactive_no_smtp():
    """Verify that request-otp returns an HTTP 500 when DEMO_MODE is inactive and SMTP is unconfigured."""
    os.environ["DEMO_MODE"] = "false"
    # Ensure SMTP_PASSWORD is empty
    os.environ["SMTP_PASSWORD"] = ""
    response = client.post("/auth/request-otp", json={"email": "test_sec_emp@goalforge.ai"})
    assert response.status_code == 500
    assert "Mailing service (SMTP) is not configured" in response.json()["detail"]


def test_secure_cookie_login():
    """Verify that a successful login sets the access_token secure cookie."""
    response = client.post("/auth/login", json={"email": "test_sec_emp@goalforge.ai", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.cookies
    assert response.cookies["access_token"] is not None


def test_secure_cookie_logout():
    """Verify that logout deletes the access_token cookie."""
    response = client.post("/auth/logout")
    assert response.status_code == 200
    cookie = response.cookies.get("access_token")
    assert cookie is None or cookie == ""


@pytest.mark.asyncio
async def test_redis_rate_limiter_limit_exceeded():
    """Verify that Redis-backed rate limiter blocks requests when limit is exceeded."""
    from app.middleware.rate_limit import RateLimitMiddleware
    
    class MockRedisPipeline:
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass
        def zadd(self, key, mapping): pass
        def zremrangebyscore(self, key, min_val, max_val): pass
        def zcard(self, key): pass
        def expire(self, key, seconds): pass
        async def execute(self):
            # zadd=1, zremrange=0, zcard=11 (which is > 10, thus blocked), expire=True
            return [1, 0, 11, True]

    class MockRedisClient:
        def pipeline(self, transaction=True):
            return MockRedisPipeline()

    middleware = RateLimitMiddleware(None)
    middleware.redis_client = MockRedisClient()
    
    is_limited = await middleware._is_rate_limited(
        client_ip="127.0.0.1",
        limit=10,
        window=60,
        endpoint_type="ai",
        fallback_registry={}
    )
    assert is_limited is True


@pytest.mark.asyncio
async def test_redis_rate_limiter_under_limit():
    """Verify that Redis-backed rate limiter allows requests when under the limit."""
    from app.middleware.rate_limit import RateLimitMiddleware
    
    class MockRedisPipeline:
        async def __aenter__(self): return self
        async def __aexit__(self, exc_type, exc_val, exc_tb): pass
        def zadd(self, key, mapping): pass
        def zremrangebyscore(self, key, min_val, max_val): pass
        def zcard(self, key): pass
        def expire(self, key, seconds): pass
        async def execute(self):
            # zadd=1, zremrange=0, zcard=5 (which is <= 10, thus allowed), expire=True
            return [1, 0, 5, True]

    class MockRedisClient:
        def pipeline(self, transaction=True):
            return MockRedisPipeline()

    middleware = RateLimitMiddleware(None)
    middleware.redis_client = MockRedisClient()
    
    is_limited = await middleware._is_rate_limited(
        client_ip="127.0.0.1",
        limit=10,
        window=60,
        endpoint_type="ai",
        fallback_registry={}
    )
    assert is_limited is False


def test_rate_limiter_x_forwarded_for():
    """Verify that RateLimitMiddleware extracts client IP from X-Forwarded-For header."""
    from starlette.requests import Request
    from starlette.types import Scope
    from app.middleware.rate_limit import RateLimitMiddleware
    
    middleware = RateLimitMiddleware(None)
    
    # Mock ASGI scope
    scope: Scope = {
        "type": "http",
        "method": "GET",
        "path": "/ai/copilot",
        "headers": [(b"x-forwarded-for", b"203.0.113.195, 70.41.3.18")],
    }
    req = Request(scope)
    
    # We can mock call_next
    async def call_next(r):
        return r
        
    # We want to check that it extracts client_ip as 203.0.113.195
    extracted_ip = None
    async def mock_is_rate_limited(client_ip, limit, window, endpoint_type, fallback_registry):
        nonlocal extracted_ip
        extracted_ip = client_ip
        return False
        
    middleware._is_rate_limited = mock_is_rate_limited
    
    # Run dispatch
    import asyncio
    asyncio.run(middleware.dispatch(req, call_next))
    
    assert extracted_ip == "203.0.113.195"


def test_change_password_success():
    """Verify that password change works, hashes the new password, and resets OTP/lockout state."""
    local_client = TestClient(app, base_url="https://testserver")
    # 1. Log in to get authentication cookie
    login_res = local_client.post("/auth/login", json={"email": "test_sec_emp@goalforge.ai", "password": "password123"})
    assert login_res.status_code == 200
    
    # 2. Call change-password route
    change_res = local_client.post(
        "/auth/change-password",
        json={"current_password": "password123", "new_password": "newpassword456"}
    )
    assert change_res.status_code == 200
    
    # 3. Try logging in with the old password (should fail)
    old_login = local_client.post("/auth/login", json={"email": "test_sec_emp@goalforge.ai", "password": "password123"})
    assert old_login.status_code == 401
    
    # 4. Try logging in with the new password (should succeed)
    new_login = local_client.post("/auth/login", json={"email": "test_sec_emp@goalforge.ai", "password": "newpassword456"})
    assert new_login.status_code == 200
    
    # 5. Verify Database User record directly to ensure all OTP/lockout fields are cleared
    async def verify_db():
        async with async_session() as db:
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.email == "test_sec_emp@goalforge.ai"))
            user = result.scalar_one()
            assert user.otp_code is None
            assert user.otp_expires_at is None
            assert user.otp_failed_attempts == 0
            assert user.otp_lockout_count == 0
            assert user.otp_locked_until is None
            
    import asyncio
    asyncio.run(verify_db())


def test_change_password_incorrect_current():
    """Verify that password change fails when current password is wrong."""
    local_client = TestClient(app, base_url="https://testserver")
    login_res = local_client.post("/auth/login", json={"email": "test_sec_emp@goalforge.ai", "password": "password123"})
    assert login_res.status_code == 200
    
    change_res = local_client.post(
        "/auth/change-password",
        json={"current_password": "wrongpassword", "new_password": "newpassword456"}
    )
    assert change_res.status_code == 400
    assert "Incorrect current password" in change_res.json()["detail"]


def test_production_cors_origins_validator():
    """Verify that starting in production with wildcard or empty CORS_ORIGINS raises ValueError."""
    from app.core.config import Settings
    import pytest
    
    # Empty CORS
    with pytest.raises(ValueError, match="CORS_ORIGINS must be set to an explicit whitelist in production"):
        Settings(DEBUG=False, CORS_ORIGINS="", SECRET_KEY="secure-prod-key-123")
        
    # Wildcard CORS
    with pytest.raises(ValueError, match="CORS_ORIGINS must be set to an explicit whitelist in production"):
        Settings(DEBUG=False, CORS_ORIGINS="*", SECRET_KEY="secure-prod-key-123")
        
    # Valid CORS
    settings = Settings(DEBUG=False, CORS_ORIGINS="https://goalforge.ai", SECRET_KEY="secure-prod-key-123")
    assert settings.CORS_ORIGINS == "https://goalforge.ai"


def test_seed_endpoint_production_protection():
    """Verify that /seed endpoint is blocked in production."""
    from app.core.config import settings
    # Temporarily set DEBUG to False to simulate production
    original_debug = settings.DEBUG
    try:
        settings.DEBUG = False
        response = client.get("/seed")
        assert response.status_code == 403
        assert "not permitted in production" in response.json()["detail"]
    finally:
        settings.DEBUG = original_debug


def test_metrics_endpoint_local_protection():
    """Verify that /metrics endpoint blocks non-local access."""
    from starlette.requests import Request
    from starlette.types import Scope
    
    # We can invoke the endpoint directly to test the host validation
    # Normally TestClient uses 'testserver' which is allowed.
    response = client.get("/metrics")
    assert response.status_code == 200  # Should be allowed for testserver
    
    # We can test blocking by simulating a remote ASGI scope
    scope: Scope = {
        "type": "http",
        "method": "GET",
        "path": "/metrics",
        "client": ("203.0.113.195", 12345),
        "headers": [],
        "query_string": b""
    }
    import asyncio
    from app.main import app
    
    async def run_asgi():
        async def receive(): return {"type": "http.request"}
        response_status = None
        async def send(message):
            nonlocal response_status
            if message["type"] == "http.response.start":
                response_status = message["status"]
        await app(scope, receive, send)
        return response_status
        
    status = asyncio.run(run_asgi())
    assert status == 403
