from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

class AuditMixin:
    """
    Mixin to add created_by and updated_by columns to models for audit tracking.
    """
    created_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
