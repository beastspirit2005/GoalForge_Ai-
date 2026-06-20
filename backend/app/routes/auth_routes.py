from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Response
import os
import uuid
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.auth_schema import (
    LoginRequest,
    OTPRequest,
    OTPVerify,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    UserUpdate,
    PasswordChangeRequest,
)
from app.services.auth_service import (
    authenticate_user,
    create_token_for_user,
    generate_and_send_otp,
    register_user,
    verify_otp_and_login,
    change_user_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(response: Response, data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_token_for_user(user)
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24, # 24 hours
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(data: UserUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.name is not None:
        current_user.name = data.name
    if data.department is not None:
        current_user.department = data.department
    if data.profile_picture_url is not None:
        current_user.profile_picture_url = data.profile_picture_url
    if data.preferred_ai_provider is not None:
        current_user.preferred_ai_provider = data.preferred_ai_provider
    if data.preferred_ai_model is not None:
        current_user.preferred_ai_model = data.preferred_ai_model
    
    await db.flush()
    await db.refresh(current_user)
    return current_user


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    # Validate file extension
    allowed_extensions = {"png", "jpg", "jpeg", "gif", "webp"}
    ext = (file.filename or "").rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File extension '.{ext}' is not allowed. Use: {', '.join(allowed_extensions)}")
    
    # Validate file magic bytes match declared extension
    _MAGIC_BYTES = {
        "png": [b"\x89PNG"],
        "jpg": [b"\xff\xd8\xff"],
        "jpeg": [b"\xff\xd8\xff"],
        "gif": [b"GIF87a", b"GIF89a"],
        "webp": [b"RIFF"],
    }
    header = await file.read(12)
    await file.seek(0)  # Reset for later full read
    signatures = _MAGIC_BYTES.get(ext, [])
    if not any(header.startswith(sig) for sig in signatures):
        raise HTTPException(status_code=400, detail=f"File content does not match '.{ext}' format. Upload a genuine image file.")

    # Validate file size (max 5MB)
    contents = await file.read()
    max_size = 5 * 1024 * 1024  # 5MB
    if len(contents) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 5MB limit.")
    
    # Generate unique filename (ext already validated above)
    filename = f"{uuid.uuid4()}.{ext}"
    _upload_dir = Path(__file__).resolve().parents[2] / "uploads" / "avatars"
    _upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = _upload_dir / filename
    
    with open(file_path, "wb") as f:
        f.write(contents)
        
    base_url = str(request.base_url).rstrip("/")
    current_user.profile_picture_url = f"{base_url}/uploads/avatars/{filename}"
    await db.flush()
    await db.refresh(current_user)
    
    return current_user


@router.post("/request-otp", status_code=status.HTTP_200_OK)
async def request_otp(data: OTPRequest, db: AsyncSession = Depends(get_db)):
    from app.services.email_service import EmailDeliveryError, is_demo_mode, is_email_configured, _get_smtp_config
    
    demo_mode = is_demo_mode()
    print("DEBUG SMTP CONFIG:", _get_smtp_config())
    if not demo_mode and not is_email_configured():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mailing service (SMTP) is not configured on this server."
        )

    try:
        otp_code = await generate_and_send_otp(db, data.email)
    except EmailDeliveryError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    
    if demo_mode:
        return {
            "message": f"Demo Mode: Use code {otp_code} to log in. (Email sending skipped in production demo)"
        }
        
    return {"message": "OTP sent successfully! Check your inbox."}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(response: Response, data: OTPVerify, db: AsyncSession = Depends(get_db)):
    user = await verify_otp_and_login(db, data.email, data.otp_code)
    token = create_token_for_user(user)
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=60 * 60 * 24, # 24 hours
    )
    return TokenResponse(access_token=token)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=True,
        samesite="strict",
    )
    return {"message": "Logged out successfully"}


@router.post("/change-password", response_model=UserResponse)
async def change_password(
    data: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = await change_user_password(
        db, current_user, data.current_password, data.new_password
    )
    return user

