from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Float, Text, LargeBinary, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.role import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone_number: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.EMPLOYEE.value, index=True)
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    manager_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False)
    otp_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    otp_failed_attempts: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    otp_lockout_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    otp_locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    microsoft_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    profile_picture_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Enterprise Talent fields
    experience_years: Mapped[float | None] = mapped_column(Float, nullable=True)
    experience_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_text_encrypted: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    work_points: Mapped[float] = mapped_column(Float, default=0.0, server_default="0")
    
    # Enterprise Org fields
    department_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    org_tree_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Global AI Master Control
    preferred_ai_provider: Mapped[str] = mapped_column(String(20), nullable=False, default="gemini", server_default="gemini")
    preferred_ai_model: Mapped[str] = mapped_column(String(50), nullable=False, default="gemini-2.5-flash", server_default="gemini-2.5-flash")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    goals = relationship("Goal", back_populates="owner", foreign_keys="Goal.user_id")
    managed_employees = relationship("User", backref="manager", remote_side="User.id", foreign_keys=[manager_id])
    user_skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")


    def __repr__(self) -> str:
        return f"<User {self.id} {self.email} [{self.role}]>"
