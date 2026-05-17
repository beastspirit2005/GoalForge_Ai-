from pydantic import BaseModel


class AIGeneratePlanRequest(BaseModel):
    title: str
    description: str = ""
    target: str = ""
    deadline: str = ""


class AIGeneratePlanResponse(BaseModel):
    milestones: list[str]
    recommendation: str
    risk: str
    source: str  # "gemini" | "fallback"
    raw_response: str = ""


class AIRefineGoalRequest(BaseModel):
    raw_goal: str


class AIRefineGoalResponse(BaseModel):
    refined_title: str
    refined_description: str
    suggested_target: str
    source: str


class CopilotRequest(BaseModel):
    query: str
    context: str = "" # Provide stringified context of goals/checkins


class CopilotResponse(BaseModel):
    response: str
    source: str
