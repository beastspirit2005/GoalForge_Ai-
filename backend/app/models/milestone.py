from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Milestone(Base):
    __tablename__ = "milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    due_date: Mapped[str | None] = mapped_column(String(30), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    source: Mapped[str] = mapped_column(String(20), default="ai")  # "ai" | "manual"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    goal = relationship("Goal", back_populates="milestones")

    def __repr__(self) -> str:
        status = "✓" if self.is_completed else "○"
        return f"<Milestone {self.id} {status} '{self.title[:40]}'>"
