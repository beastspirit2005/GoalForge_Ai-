"""Authentication service – register, login, profile, OTP with progressive lockout."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import secrets
from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth_schema import RegisterRequest

# ── Progressive lockout tiers (minutes) ─────────────────────
# Index = otp_lockout_count (1-based after increment).
# None = permanent lock (admin must re-enable).
_LOCKOUT_MINUTES = [5, 10, 15, None]


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        department=data.department,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.password_hash):
        if not user.is_approved:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending admin approval")
        return user
    return None


def create_token_for_user(user: User) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role})


async def get_all_users(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def update_user(db: AsyncSession, user: User, **kwargs) -> User:
    for key, value in kwargs.items():
        if value is not None and hasattr(user, key):
            setattr(user, key, value)
    await db.flush()
    await db.refresh(user)
    return user


async def generate_and_send_otp(db: AsyncSession, email: str) -> str:
    """Generate a cryptographically secure OTP code and email it to the user."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found with this email")

    from fastapi import HTTPException, status

    # Block OTP requests while a timed lockout is active — O(1) timestamp check
    if user.otp_locked_until:
        locked_until = user.otp_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > datetime.now(timezone.utc):
            remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(
                status_code=423,
                detail=f"Account is temporarily locked. Try again in {remaining} seconds.",
            )
        # Timed lockout has expired — clear it
        user.otp_locked_until = None

    # Permanently locked accounts cannot request OTPs
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is locked. Contact an administrator.")

    # Generate 6-digit code using OS-level CSPRNG (secrets module)
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.otp_code = code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    # Preserve otp_failed_attempts across re-requests so attackers cannot
    # reset the counter by requesting new codes. Only lockout or success resets it.
    await db.commit()

    # Send OTP via email
    from app.services.email_service import send_otp_email
    send_otp_email(email, user.name, code)

    return code


async def verify_otp_and_login(db: AsyncSession, email: str, code: str) -> User:
    """Verify OTP with progressive lockout: 3 tries → 5m → 10m → 15m → permanent."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    from fastapi import HTTPException, status
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_approved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending admin approval")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is locked. Contact an administrator.")

    # ── O(1) lockout gate — single timestamp comparison ──
    if user.otp_locked_until:
        locked_until = user.otp_locked_until
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(tzinfo=timezone.utc)
        if locked_until > datetime.now(timezone.utc):
            remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds())
            raise HTTPException(
                status_code=423,
                detail=f"Account is temporarily locked. Try again in {remaining} seconds.",
            )
        # Timed lockout expired — clear it, let verification proceed
        user.otp_locked_until = None

    # ── Validate OTP existence and expiration ──
    if not user.otp_code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No active OTP. Please request a new one.")

    if user.otp_expires_at:
        expires_at = user.otp_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            # Expired — wipe and reject
            user.otp_code = None
            user.otp_expires_at = None
            await db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code expired. Please request a new one.")
    else:
        user.otp_code = None
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code expired. Please request a new one.")

    # ── Code mismatch — wipe + increment + possible lockout ──
    if user.otp_code != code:
        user.otp_failed_attempts += 1

        if user.otp_failed_attempts >= 3:
            # Escalate lockout tier
            user.otp_lockout_count += 1
            tier_index = user.otp_lockout_count - 1  # 0-based index into _LOCKOUT_MINUTES

            if tier_index < len(_LOCKOUT_MINUTES) and _LOCKOUT_MINUTES[tier_index] is not None:
                # Timed lockout
                lock_duration = _LOCKOUT_MINUTES[tier_index]
                user.otp_locked_until = datetime.now(timezone.utc) + timedelta(minutes=lock_duration)
                detail_msg = f"Too many failed attempts. Account locked for {lock_duration} minutes."
            else:
                # Permanent lockout — admin must re-enable
                user.is_active = False
                detail_msg = "Account permanently locked due to repeated failed attempts. Contact an administrator."

            # Wipe OTP and reset per-window counter for next window
            user.otp_code = None
            user.otp_expires_at = None
            user.otp_failed_attempts = 0
            await db.commit()
            raise HTTPException(status_code=423, detail=detail_msg)

        # Still within the 3-try window — wipe code to force re-request
        user.otp_code = None
        user.otp_expires_at = None
        await db.commit()
        attempts_left = 3 - user.otp_failed_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid OTP code. {attempts_left} attempt(s) remaining. Request a new code to try again.",
        )

    # ── Success — reset all lockout state in one write ──
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_failed_attempts = 0
    user.otp_lockout_count = 0
    user.otp_locked_until = None
    await db.commit()

    return user

