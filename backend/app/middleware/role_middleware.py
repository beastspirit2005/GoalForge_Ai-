"""Role-based middleware (informational – real enforcement is in auth.py require_role)."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse


# Path prefix → allowed roles mapping
ROLE_RULES: dict[str, set[str]] = {
    "/admin": {"admin"},
    "/manager": {"manager", "admin"},
}


class RoleMiddleware(BaseHTTPMiddleware):
    """Optional middleware layer — primary enforcement is via Depends(require_role)."""

    async def dispatch(self, request: Request, call_next):
        user_role = getattr(request.state, "user_role", None)

        if user_role:
            for prefix, allowed in ROLE_RULES.items():
                if request.url.path.startswith(prefix) and user_role not in allowed:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": f"Role '{user_role}' cannot access {prefix} routes"},
                    )

        return await call_next(request)
