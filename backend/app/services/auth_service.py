"""Authentication service – register, login, profile."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import random
from datetime import datetime, timedelta, timezone

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth_schema import RegisterRequest


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


async def generate_and_send_otp(db: AsyncSession, phone_number: str) -> None:
    result = await db.execute(select(User).where(User.phone_number == phone_number))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found with this phone number")
    
    # Generate 6-digit code
    code = f"{random.randint(0, 999999):06d}"
    user.otp_code = code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.commit()
    
    # Simulate SMS sending
    print(f"\n[SMS Mock] Sending OTP to {phone_number}: {code}\n")


async def verify_otp_and_login(db: AsyncSession, phone_number: str, code: str) -> User:
    result = await db.execute(select(User).where(User.phone_number == phone_number))
    user = result.scalar_one_or_none()
    
    from fastapi import HTTPException, status
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.otp_code or user.otp_code != code:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP code")
        
    if not user.otp_expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code expired")
        
    expires_at = user.otp_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP code expired")
        
    # Clear the OTP code after successful verification
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    
    return user
