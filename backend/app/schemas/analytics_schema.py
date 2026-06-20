from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class DepartmentStat(BaseModel):
    name: str
    progress: float
    goals: int


class MomentumPoint(BaseModel):
    week: str
    value: float


class RiskBucket(BaseModel):
    risk: str
    count: int


class AnalyticsOverview(BaseModel):
    total_users: int
    total_goals: int
    avg_progress: float
    overdue_checkins: int
    departments: list[DepartmentStat]
    momentum: list[MomentumPoint]
    risk_distribution: list[RiskBucket]


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    entity_type: str
    entity_id: int
    old_value: str | None
    new_value: str | None
    created_at: str | None = None
    user_name: str | None = None

    model_config = ConfigDict(from_attributes=True)
