from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TargetCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    required_skills: str | None = None
    manager_id: int | None = None
    deadline: datetime | None = None

class TargetResponse(BaseModel):
    id: int
    title: str
    description: str | None
    required_skills: str | None
    manager_id: int | None
    pending_review: bool
    progress: float
    deadline: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskCreate(BaseModel):
    target_id: int
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    required_skills: str | None = None
    assigned_to: int | None = None
    deadline: datetime | None = None

class TaskResponse(BaseModel):
    id: int
    target_id: int
    title: str
    description: str | None
    required_skills: str | None
    assigned_to: int | None
    pending_review: bool
    progress: float
    deadline: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
