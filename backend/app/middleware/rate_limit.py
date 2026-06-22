import time
import logging
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.config import settings

# Global in-memory fallback registries mapped by client IP.
# Declared globally so they are easily accessible for test-suite sweeps.
AI_REQUESTS = defaultdict(list)
ADMIN_REQUESTS = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Protects high-computation AI endpoints and sensitive admin panels from API abuse.
    Implements a sliding window algorithm using Redis Sorted Sets with a graceful in-memory fallback.
    """
    def __init__(self, app):
        super().__init__(app)
        self.redis_client = None
        if settings.REDIS_URL:
            try:
                from redis.asyncio import Redis
                self.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)
                logging.info(f"RateLimitMiddleware initialized with Redis: {settings.REDIS_URL}")
            except Exception as e:
                logging.error(f"Failed to initialize Redis client: {e}. Falling back to in-memory.")

    async def _is_rate_limited(
        self, client_ip: str, limit: int, window: int, endpoint_type: str, fallback_registry: dict
    ) -> bool:
        """Check if request is rate limited. Uses Redis if available, else falls back to in-memory dictionary."""
        now = time.time()
        
        # 1. Try Redis Sorted Set sliding-window implementation
        if self.redis_client:
            key = f"ratelimit:{endpoint_type}:{client_ip}"
            boundary = now - window
            try:
                # Run ZADD, ZREMRANGEBYSCORE, ZCARD, EXPIRE in a single atomic pipeline
                async with self.redis_client.pipeline(transaction=True) as pipe:
                    pipe.zadd(key, {str(now): now})
                    pipe.zremrangebyscore(key, 0, boundary)
                    pipe.zcard(key)
                    pipe.expire(key, window)
                    _, _, count, _ = await pipe.execute()
                
                # Since we already added the new request, count > limit indicates rate limit exceeded
                if count > limit:
                    return True
                return False
            except Exception as e:
                logging.warning(f"Redis rate limiter failed ({e}). Gracefully falling back to in-memory.")
        
        # 2. In-memory sliding-window fallback
        timestamps = fallback_registry[client_ip]
        valid_timestamps = [t for t in timestamps if now - t < window]
        fallback_registry[client_ip] = valid_timestamps
        
        if len(valid_timestamps) >= limit:
            return True
            
        fallback_registry[client_ip].append(now)
        return False

    async def dispatch(self, request: Request, call_next):
        # Safely extract client IP, evaluating X-Forwarded-For proxy headers when available
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For is a comma-separated list of IPs: Client, Proxy1, Proxy2...
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"
            
        path = request.url.path
        
        # 1. Protect expensive AI Copilot chat endpoints -> Max 10 requests / minute
        if "/ai/copilot" in path or "/ai/chat" in path or "/ai/generate-plan" in path or "/ai/refine-goal" in path:
            is_limited = await self._is_rate_limited(
                client_ip=client_ip,
                limit=10,
                window=60,
                endpoint_type="ai",
                fallback_registry=AI_REQUESTS
            )
            if is_limited:
                headers = {"Retry-After": "60"}
                origin = request.headers.get("origin")
                if origin:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Access-Control-Allow-Credentials"] = "true"
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. AI Copilot is limited to 10 queries per minute to protect API limits."
                    },
                    headers=headers,
                )
            
        # 2. Protect Admin Console and CRUD operations -> Max 30 requests / minute
        elif path.startswith("/admin") or "/admin/" in path:
            is_limited = await self._is_rate_limited(
                client_ip=client_ip,
                limit=30,
                window=60,
                endpoint_type="admin",
                fallback_registry=ADMIN_REQUESTS
            )
            if is_limited:
                headers = {"Retry-After": "60"}
                origin = request.headers.get("origin")
                if origin:
                    headers["Access-Control-Allow-Origin"] = origin
                    headers["Access-Control-Allow-Credentials"] = "true"
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Administrative endpoints are throttled to 30 requests per minute."
                    },
                    headers=headers,
                )
            
        return await call_next(request)
