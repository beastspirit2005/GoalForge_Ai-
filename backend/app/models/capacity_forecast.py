"""Capacity Forecast model — tracks demand vs capacity forecasts."""

from datetime import datetime
from sqlalchemy import DateTime, Float, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class CapacityForecast(Base):
    __tablename__ = "capacity_forecasts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    department: Mapped[str | None] = mapped_column(String(120), nullable=True)
    forecast_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    available_capacity_tasks: Mapped[int] = mapped_column(Integer, default=0)
    upcoming_demand_tasks: Mapped[int] = mapped_column(Integer, default=0)
    gap_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="balanced")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_capacity_dept_date", "department", "forecast_date"),
    )

    def __repr__(self) -> str:
        return f"<CapacityForecast dept={self.department} gap={self.gap_percentage}% [{self.status}]>"
