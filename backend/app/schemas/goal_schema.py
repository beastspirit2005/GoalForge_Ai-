from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    target: str | None = None
    uom: str | None = None
    weightage: float = Field(..., ge=10.0, le=100.0)
    deadline: datetime | None = None


class GoalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    target: str | None = None
    uom: str | None = None
    weightage: float | None = Field(default=None, ge=10.0, le=100.0)
    deadline: datetime | None = None
    progress: float | None = Field(default=None, ge=0.0, le=100.0)


class GoalResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: str | None
    target: str | None
    uom: str | None
    weightage: float
    deadline: datetime | None
    status: str
    progress: float
    risk: str
    is_shared: bool
    ai_recommendation: str | None
    created_at: str | None = None
    updated_at: str | None = None
    owner_name: str | None = None
    department: str | None = None
    milestones: list["MilestoneResponse"] = []

    model_config = ConfigDict(from_attributes=True)


class MilestoneCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
    due_date: datetime | None = None
    source: str = "manual"


class MilestoneResponse(BaseModel):
    id: int
    goal_id: int
    title: str
    due_date: datetime | None
    is_completed: bool
    source: str

    model_config = ConfigDict(from_attributes=True)


class GoalApprovalRequest(BaseModel):
    action: str = Field(..., pattern="^(approve|reject)$")
    comment: str | None = None
    weightage: float | None = Field(default=None, ge=10.0, le=100.0)
    target: str | None = None
