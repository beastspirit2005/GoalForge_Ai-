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
