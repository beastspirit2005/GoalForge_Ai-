from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Checkin(Base):
    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    quarter: Mapped[str] = mapped_column(String(10), nullable=False)  # e.g. "Q2-2026"
    actual_achievement: Mapped[float] = mapped_column(Float, default=0.0)
    progress_status: Mapped[str] = mapped_column(String(30), default="On Track")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    manager_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    goal = relationship("Goal", back_populates="checkins")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<Checkin {self.id} goal={self.goal_id} {self.quarter}>"
