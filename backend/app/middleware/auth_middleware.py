"""JWT authentication middleware (for WebSocket or custom flows)."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from app.core.security import decode_access_token


class AuthMiddleware(BaseHTTPMiddleware):
    """Attach user info from JWT to request.state (optional layer)."""

    async def dispatch(self, request: Request, call_next):
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            payload = decode_access_token(token)
            if payload:
                request.state.user_id = payload.get("sub")
                request.state.user_role = payload.get("role")
        response = await call_next(request)
        return response
