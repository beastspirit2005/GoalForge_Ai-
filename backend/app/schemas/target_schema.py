from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TargetCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str | None = None
    required_skills: list[str] | None = None
    manager_id: int | None = None
    deadline: datetime | None = None

class TargetUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = None
    required_skills: list[str] | None = None
    manager_id: int | None = None
    deadline: datetime | None = None

class TargetResponse(BaseModel):
    id: int
    title: str
    description: str | None
    required_skills: list[str] | None = None
    manager_id: int | None
    manager_name: str | None = None
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
    required_skills: list[str] | None = None
    assigned_to: int | None = None
    assignee_ids: list[int] | None = None
    deadline: datetime | None = None

class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = None
    required_skills: list[str] | None = None
    assigned_to: int | None = None
    assignee_ids: list[int] | None = None
    deadline: datetime | None = None

class TaskAssigneeSchema(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)

class TaskGoalSchema(BaseModel):
    id: int
    title: str
    owner_name: str | None = None
    owner_id: int
    progress: float
    status: str

    model_config = ConfigDict(from_attributes=True)

class TaskResponse(BaseModel):
    id: int
    target_id: int
    title: str
    description: str | None
    required_skills: list[str] | None = None
    assigned_to: int | None
    assigned_user_name: str | None = None
    assignees: list[TaskAssigneeSchema] | None = None
    goals: list[TaskGoalSchema] | None = None
    pending_review: bool
    progress: float
    deadline: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

