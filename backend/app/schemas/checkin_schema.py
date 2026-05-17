from pydantic import BaseModel, Field


class CheckinCreate(BaseModel):
    goal_id: int
    quarter: str = Field(..., pattern=r"^Q[1-4]-\d{4}$")
    actual_achievement: float = Field(default=0.0, ge=0.0)
    progress_status: str = "On Track"
    notes: str | None = None


class CheckinUpdate(BaseModel):
    actual_achievement: float | None = Field(default=None, ge=0.0)
    progress_status: str | None = None
    notes: str | None = None
    manager_comment: str | None = None


class CheckinResponse(BaseModel):
    id: int
    goal_id: int
    user_id: int
    quarter: str
    actual_achievement: float
    progress_status: str
    notes: str | None
    manager_comment: str | None
    created_at: str | None = None
    goal_title: str | None = None

    class Config:
        from_attributes = True
