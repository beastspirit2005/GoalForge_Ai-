from __future__ import annotations
"""Learning Recommendation model — AI-suggested learning paths for skill gaps."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class LearningRecommendation(Base):
    __tablename__ = "learning_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    required_skill: Mapped[str] = mapped_column(String(100), nullable=False)
    current_confidence: Mapped[float] = mapped_column(Float, default=0.0)
    gap_score: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation_type: Mapped[str] = mapped_column(String(30), default="course")
    recommendation_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    estimated_completion_days: Mapped[int] = mapped_column(Integer, default=7)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("User", backref="learning_recommendations")

    def __repr__(self) -> str:
        return f"<LearningRecommendation user={self.employee_id} skill={self.required_skill} gap={self.gap_score}>"
