from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.role import GoalRisk, GoalStatus


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target: Mapped[str | None] = mapped_column(String(500), nullable=True)
    uom: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Unit of Measurement
    weightage: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=GoalStatus.DRAFT.value)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    risk: Mapped[str] = mapped_column(String(10), default=GoalRisk.LOW.value)
    is_shared: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    owner = relationship("User", back_populates="goals", foreign_keys=[user_id])
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")
    checkins = relationship("Checkin", back_populates="goal", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Goal {self.id} '{self.title}' [{self.status}]>"
