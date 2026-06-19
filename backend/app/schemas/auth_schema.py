from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(default="employee")
    department: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OTPRequest(BaseModel):
    email: EmailStr


class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    department: str | None
    manager_id: int | None
    is_active: bool
    is_approved: bool
    profile_picture_url: str | None = None
    google_id: str | None = None
    microsoft_id: str | None = None
    preferred_ai_provider: str = "gemini"
    preferred_ai_model: str = "gemini-2.5-flash"

    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    role: str | None = None
    manager_id: int | None = None
    is_active: bool | None = None
    is_approved: bool | None = None
    profile_picture_url: str | None = None
    google_id: str | None = None
    microsoft_id: str | None = None
    preferred_ai_provider: str | None = None
    preferred_ai_model: str | None = None


class AdminUserUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    role: str | None = None
    manager_id: int | None = None
    is_active: bool | None = None
    is_approved: bool | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

