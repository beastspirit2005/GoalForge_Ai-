import time
from collections import defaultdict
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

# Global in-memory request registries mapped by client IP.
# Declared globally so they are easily accessible for test-suite sweeps.
AI_REQUESTS = defaultdict(list)
ADMIN_REQUESTS = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Protects high-computation AI endpoints and sensitive admin panels from API abuse.
    Implements a sliding window algorithm to monitor and block spam with HTTP 429.
    """
    async def dispatch(self, request: Request, call_next):
        # Safely extract client IP, fallback to loopback if behind a proxy
        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        now = time.time()
        
        # 1. Protect expensive AI Copilot chat endpoints -> Max 10 requests / minute
        if "/ai/copilot" in path or "/ai/chat" in path:
            timestamps = AI_REQUESTS[client_ip]
            # Keep only hits within the active 60-second window
            valid_timestamps = [t for t in timestamps if now - t < 60]
            AI_REQUESTS[client_ip] = valid_timestamps
            
            if len(valid_timestamps) >= 10:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. AI Copilot is limited to 10 queries per minute to protect API limits."
                    },
                )
            AI_REQUESTS[client_ip].append(now)
            
        # 2. Protect Admin Console and CRUD operations -> Max 30 requests / minute
        elif path.startswith("/admin") or "/admin/" in path:
            timestamps = ADMIN_REQUESTS[client_ip]
            # Keep only hits within the active 60-second window
            valid_timestamps = [t for t in timestamps if now - t < 60]
            ADMIN_REQUESTS[client_ip] = valid_timestamps
            
            if len(valid_timestamps) >= 30:
                return JSONResponse(
                    status_code=429,
                    content={
                        "detail": "Too many requests. Administrative endpoints are throttled to 30 requests per minute."
                    },
                )
            ADMIN_REQUESTS[client_ip].append(now)
            
        return await call_next(request)
