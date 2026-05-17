"""Prompt templates for Gemini AI calls."""


def milestone_prompt(title: str, description: str, target: str, deadline: str) -> str:
    return f"""You are an enterprise performance coach.

Goal Title: {title}
Description: {description}
Target: {target}
Deadline: {deadline}

Return only valid JSON in this shape:
{{
  "milestones": ["5 concise milestones"],
  "recommendation": "1 productivity recommendation",
  "risk": "Low, Medium, or High"
}}"""


def refine_goal_prompt(raw_goal: str) -> str:
    return f"""You are an enterprise goal-setting expert.

An employee wrote this goal informally:
"{raw_goal}"

Refine it into a measurable enterprise goal. Return only valid JSON:
{{
  "refined_title": "Short, clear title (max 80 chars)",
  "refined_description": "2-3 sentences explaining the measurable outcome",
  "suggested_target": "A specific, quantifiable target"
}}"""


def recommendation_prompt(
    title: str, progress: float, days_left: int | None, milestones_done: int, milestones_total: int
) -> str:
    return f"""You are a productivity coach analyzing an employee's goal.

Goal: {title}
Progress: {progress}%
Days until deadline: {days_left if days_left else 'unknown'}
Milestones: {milestones_done}/{milestones_total} completed

Give one concise, actionable recommendation to improve achievement probability.
Return only the recommendation text, no JSON."""


def risk_analysis_prompt(
    title: str, progress: float, deadline: str, goal_count: int
) -> str:
    return f"""Analyze risk for this goal:

Goal: {title}
Progress: {progress}%
Deadline: {deadline}
Employee's total goals: {goal_count}

Return only valid JSON:
{{
  "risk": "Low, Medium, or High",
  "reason": "1-sentence explanation"
}}"""


def ai_buddy_prompt(query: str, context: str) -> str:
    return f"""You are 'Ai Buddy', an intelligent enterprise performance coach.
Your job is to assist employees or managers with their goals, priorities, and performance.

Context about the user's current state (goals, milestones, checkins, etc):
{context}

User Query:
{query}

Respond in a helpful, conversational, and professional tone. Keep it concise, actionable, and formatted in Markdown. Focus entirely on the user's performance and the provided context. If they ask a general question, guide it back to their goals."""
