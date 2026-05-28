from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
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
)
from app.services.auth_service import (
    authenticate_user,
    create_token_for_user,
    generate_and_send_otp,
    register_user,
    verify_otp_and_login,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await register_user(db, data)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_token_for_user(user)
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
    await generate_and_send_otp(db, data.email)
    return {"message": "OTP sent successfully"}


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(data: OTPVerify, db: AsyncSession = Depends(get_db)):
    user = await verify_otp_and_login(db, data.email, data.otp_code)
    token = create_token_for_user(user)
    return TokenResponse(access_token=token)

