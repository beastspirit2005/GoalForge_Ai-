"""Dynamic recommendation engine powered by AI."""

import json

from app.core.config import settings
from app.ai.prompt_templates import recommendation_prompt


def generate_recommendation(
    title: str,
    progress: float,
    days_left: int | None,
    milestones_done: int,
    milestones_total: int,
) -> str:
    """Generate a dynamic recommendation based on current goal state."""
    if not settings.GEMINI_API_KEY:
        return _fallback_recommendation(progress, days_left)

    prompt = recommendation_prompt(title, progress, days_left, milestones_done, milestones_total)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return _fallback_recommendation(progress, days_left)


def _fallback_recommendation(progress: float, days_left: int | None) -> str:
    if progress >= 80:
        return "Strong progress. Focus on closing remaining milestones and preparing evidence for completion."
    if progress >= 50:
        return "On track — prioritize the highest-impact remaining tasks this week."
    if days_left is not None and days_left < 14:
        return "Progress is behind with limited time. Consider splitting tasks and requesting support."
    return "Start with the most impactful task and establish a daily check-in rhythm."
