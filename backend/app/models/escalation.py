"""Escalation model — tracks auto-escalated at-risk goals."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    escalated_to: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="high")  # "medium", "high", "critical"
    status: Mapped[str] = mapped_column(String(20), default="open")  # "open", "acknowledged", "resolved"
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    goal = relationship("Goal", backref="escalations")
    user = relationship("User", foreign_keys=[user_id], backref="escalations_raised")
    escalated_to_user = relationship("User", foreign_keys=[escalated_to], backref="escalations_received")

    def __repr__(self) -> str:
        return f"<Escalation {self.id} goal={self.goal_id} [{self.status}]>"
