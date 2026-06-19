"""Knowledge Risk model — detects single points of failure in skill coverage."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class KnowledgeRisk(Base):
    __tablename__ = "knowledge_risks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_name: Mapped[str] = mapped_column(String(100), nullable=False)
    primary_owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    usage_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    is_single_point_of_failure: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    backup_candidates_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_assessed: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    primary_owner = relationship("User", backref="knowledge_risks")

    def __repr__(self) -> str:
        return f"<KnowledgeRisk skill={self.skill_name} spof={self.is_single_point_of_failure}>"
