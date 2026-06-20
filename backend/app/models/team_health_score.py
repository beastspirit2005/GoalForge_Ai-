from __future__ import annotations
"""Team Health Score model — composite team health tracking."""

from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TeamHealthScore(Base):
    __tablename__ = "team_health_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    manager_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    burnout_factor: Mapped[float] = mapped_column(Float, default=0.0)
    delay_factor: Mapped[float] = mapped_column(Float, default=0.0)
    consistency_factor: Mapped[float] = mapped_column(Float, default=0.0)
    completion_rate_factor: Mapped[float] = mapped_column(Float, default=0.0)
    overall_health_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    manager = relationship("User", backref="team_health_scores")

    def __repr__(self) -> str:
        return f"<TeamHealthScore manager={self.manager_id} health={self.overall_health_score}>"
