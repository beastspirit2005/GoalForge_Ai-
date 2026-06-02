from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Response
import os
import uuid
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
    
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join("uploads", "avatars", filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    base_url = str(request.base_url).rstrip("/")
    current_user.profile_picture_url = f"{base_url}/uploads/avatars/{filename}"
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.post("/request-otp", status_code=status.HTTP_200_OK)
async def request_otp(data: OTPRequest, db: AsyncSession = Depends(get_db)):
    otp_code = await generate_and_send_otp(db, data.email)
    
    # Check if we are running in demo mode
    is_demo_mode = os.environ.get("DEMO_MODE", "false").lower() == "true"
    smtp_pass = os.environ.get("SMTP_PASSWORD")
    
    if is_demo_mode:
        return {
            "message": f"Demo Mode: Use code {otp_code} to log in. (Email sending skipped in production demo)"
        }
        
    if not smtp_pass:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Mailing service (SMTP) is not configured on this server."
        )
        
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

