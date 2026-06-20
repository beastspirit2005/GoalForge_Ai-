from __future__ import annotations
"""Recognition models — badges, streaks, trophies, leaderboard entries."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    badge_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # Badge types: "first_goal", "goal_crusher", "streak_7", "streak_30",
    # "milestone_master", "consistency_king", "early_finisher", "top_performer",
    # "team_player", "ai_adopter"
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    icon: Mapped[str] = mapped_column(String(50), default="🏅")
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="badges")

    __table_args__ = (
        Index("idx_badges_type_user", "badge_type", "user_id"),
    )

    def __repr__(self) -> str:
        return f"<Badge {self.id} '{self.title}' user={self.user_id}>"


class Streak(Base):
    __tablename__ = "streaks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    streak_type: Mapped[str] = mapped_column(String(30), nullable=False)  # "daily_update", "weekly_milestone", "checkin"
    current_count: Mapped[int] = mapped_column(Integer, default=0)
    best_count: Mapped[int] = mapped_column(Integer, default=0)
    last_activity: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="streaks")

    def __repr__(self) -> str:
        return f"<Streak {self.streak_type} current={self.current_count} best={self.best_count}>"


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "monthly", "quarterly", "yearly"
    period_label: Mapped[str] = mapped_column(String(30), nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    rank: Mapped[int] = mapped_column(Integer, default=0)
    badge_count: Mapped[int] = mapped_column(Integer, default=0)
    goals_completed: Mapped[int] = mapped_column(Integer, default=0)
    consistency_rate: Mapped[float] = mapped_column(Float, default=0.0)
    is_top_performer: Mapped[bool] = mapped_column(Boolean, default=False)  # Employee of the Month/Quarter/Year
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="leaderboard_entries")

    __table_args__ = (
        Index("idx_leaderboard_period", "period_type", "period_label"),
    )

    def __repr__(self) -> str:
        return f"<LeaderboardEntry #{self.rank} user={self.user_id} score={self.score}>"
