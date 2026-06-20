from __future__ import annotations
"""Impact Analysis model — tracks ripple effects of task delays."""

from datetime import datetime
from sqlalchemy import DateTime, Integer, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ImpactAnalysis(Base):
    __tablename__ = "impact_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    affected_tasks_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    affected_targets_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    total_expected_delay_days: Mapped[int] = mapped_column(Integer, default=0)

    source_task = relationship("Task", backref="impact_analyses")

    def __repr__(self) -> str:
        return f"<ImpactAnalysis task={self.source_task_id} delay={self.total_expected_delay_days}d>"
