from __future__ import annotations
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Decode the JWT and return the corresponding User row, checking headers first then cookies."""
    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    token_version = payload.get("v")
    if token_version is not None and token_version != user.token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")

    user.actor_id = payload.get("actor_id")
    user.impersonating = payload.get("impersonating", False)

    return user


def require_role(*allowed_roles: str):
    """Return a dependency that checks the user's role against a whitelist."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == "super_admin":
            return current_user
            
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role}' is not allowed. Required: {', '.join(allowed_roles)}",
            )
        return current_user

    return _check


def require_write_role(*allowed_roles: str):
    """Return a dependency that checks role and explicitly blocks impersonated users from write actions."""

    async def _check(current_user: User = Depends(require_role(*allowed_roles))) -> User:
        if getattr(current_user, "impersonating", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Write actions are not permitted while impersonating.",
            )
        return current_user

    return _check


def require_non_impersonated_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency for standard authenticated routes that perform write actions."""
    if getattr(current_user, "impersonating", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Write actions are not permitted while impersonating.",
        )
    return current_user


async def require_critical_otp(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Require an OTP in the X-Critical-OTP header for sensitive operations."""
    otp = request.headers.get("X-Critical-OTP")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Critical action requires OTP verification.",
            headers={"X-OTP-Required": "true"}
        )
    
    from app.services.auth_service import verify_otp_and_login
    # This will raise an HTTPException if the OTP is invalid or expired
    await verify_otp_and_login(db, current_user.email, otp)
    return current_user
