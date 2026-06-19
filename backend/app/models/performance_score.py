"""Performance score model — tracks computed scores per employee per period."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PerformanceScore(Base):
    __tablename__ = "performance_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "monthly" | "quarterly" | "yearly"
    period_label: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. "May-2026", "Q2-2026", "2026"
    milestone_completion_rate: Mapped[float] = mapped_column(Float, default=0.0)
    consistency_score: Mapped[float] = mapped_column(Float, default=0.0)
    productivity_score: Mapped[float] = mapped_column(Float, default=0.0)
    update_frequency: Mapped[float] = mapped_column(Float, default=0.0)
    planned_vs_actual: Mapped[float] = mapped_column(Float, default=0.0)
    progress_growth: Mapped[float] = mapped_column(Float, default=0.0)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    rank: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", backref="performance_scores")

    __table_args__ = (
        Index("idx_perf_user_period", "user_id", "period_label"),
    )

    def __repr__(self) -> str:
        return f"<PerformanceScore {self.user_id} {self.period_type}={self.period_label} score={self.overall_score}>"
