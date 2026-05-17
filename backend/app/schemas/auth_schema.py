from pydantic import BaseModel, EmailStr, Field


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
    phone_number: str


class OTPVerify(BaseModel):
    phone_number: str
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
    profile_picture_url: str | None = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    role: str | None = None
    manager_id: int | None = None
    is_active: bool | None = None
    profile_picture_url: str | None = None
