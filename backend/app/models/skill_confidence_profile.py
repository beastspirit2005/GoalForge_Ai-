from __future__ import annotations
"""Skill Confidence Profile model — tracks verified skill confidence per user."""

from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class SkillConfidenceProfile(Base):
    __tablename__ = "skill_confidence_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    resume_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    task_based_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    milestone_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    final_confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_history_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", backref="skill_confidence_profiles")

    def __repr__(self) -> str:
        return f"<SkillConfidenceProfile user={self.user_id} skill={self.skill_name} confidence={self.final_confidence_score}>"
