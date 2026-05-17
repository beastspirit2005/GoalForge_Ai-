from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SharedGoal(Base):
    __tablename__ = "shared_goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    goal_id: Mapped[int] = mapped_column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_to: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    weightage: Mapped[float] = mapped_column(Float, default=10.0)
    can_edit_weightage: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<SharedGoal {self.id} goal={self.goal_id} → user={self.assigned_to}>"
