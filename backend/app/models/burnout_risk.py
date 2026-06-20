from __future__ import annotations
"""Burnout Risk model — tracks burnout risk assessments per user."""

from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class BurnoutRisk(Base):
    __tablename__ = "burnout_risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level: Mapped[str] = mapped_column(String(20), nullable=False, default="low")
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    active_tasks_count: Mapped[int] = mapped_column(Integer, default=0)
    delayed_tasks_count: Mapped[int] = mapped_column(Integer, default=0)
    performance_trend: Mapped[str] = mapped_column(String(20), default="stable")
    last_assessed: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="burnout_risks")

    __table_args__ = (
        Index("idx_burnout_user_assessed", "user_id", "last_assessed"),
    )

    def __repr__(self) -> str:
        return f"<BurnoutRisk user={self.user_id} level={self.risk_level} score={self.risk_score}>"
