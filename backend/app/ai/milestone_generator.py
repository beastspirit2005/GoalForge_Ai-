"""Milestone generator using AI or fallback."""

from app.ai.gemini_client import generate_ai_plan


def generate_milestones(goal_data: dict) -> list[str]:
    """Return a list of milestone strings for a goal."""
    plan = generate_ai_plan(goal_data)
    return plan.get("milestones", [])
