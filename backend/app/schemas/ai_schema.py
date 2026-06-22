from __future__ import annotations
from pydantic import BaseModel


class AIGeneratePlanRequest(BaseModel):
    title: str
    description: str = ""
    target: str = ""
    deadline: str = ""
    provider: str = "gemini"
    model: str | None = None


class AIGeneratePlanResponse(BaseModel):
    milestones: list[str]
    recommendation: str
    risk: str
    source: str  # "gemini" | "fallback"
    raw_response: str = ""


class AIRefineGoalRequest(BaseModel):
    raw_goal: str
    provider: str = "gemini"
    model: str | None = None


class AIRefineGoalResponse(BaseModel):
    refined_title: str
    refined_description: str
    suggested_target: str
    source: str


class CopilotRequest(BaseModel):
    query: str
    context: str = ""
    provider: str = "gemini"  # "gemini" | "ollama" | "fallback"
    model: str | None = None  # Specific Ollama model name, if selected
    api_key: str | None = None



class CopilotResponse(BaseModel):
    response: str
    source: str
