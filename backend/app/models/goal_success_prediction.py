"""Goal Success Prediction model — tracks AI-predicted goal completion probabilities."""

from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class GoalSuccessPrediction(Base):
    __tablename__ = "goal_success_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_completion_probability: Mapped[float] = mapped_column(Float, default=0.0)
    predicted_delay_days: Mapped[int] = mapped_column(Integer, default=0)
    risk_factors_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    goal = relationship("Goal", backref="success_predictions")

    def __repr__(self) -> str:
        return f"<GoalSuccessPrediction goal={self.goal_id} prob={self.predicted_completion_probability}%>"
