import json
from typing import Any

from app.core.config import settings
from app.ai.prompt_templates import milestone_prompt, refine_goal_prompt, ai_buddy_prompt


def fallback_ai_plan(goal_data: dict[str, Any]) -> dict[str, Any]:
    title = goal_data.get("title", "this goal")

    return {
        "milestones": [
            f"Clarify the success metric for {title}",
            "Break the work into weekly execution tasks",
            "Complete the first progress check-in",
            "Review blockers with the manager",
            "Finalize outcomes and prepare demo evidence",
        ],
        "recommendation": (
            "Start with the highest-impact task this week, then use each "
            "check-in to remove blockers before they become deadline risks."
        ),
        "risk": "Medium",
        "source": "fallback",
        "raw_response": "",
    }


def generate_ai_plan(goal_data):
    if not settings.GEMINI_API_KEY:
        return fallback_ai_plan(goal_data)

    prompt = milestone_prompt(
        goal_data.get("title", ""),
        goal_data.get("description", ""),
        goal_data.get("target", ""),
        goal_data.get("deadline", ""),
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        raw_response = response.text.strip()

        # Strip markdown code fences if present
        clean = raw_response
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        parsed = json.loads(clean)

        return {
            "milestones": parsed.get("milestones", [])[:5],
            "recommendation": parsed.get("recommendation", ""),
            "risk": parsed.get("risk", "Medium"),
            "source": "gemini",
            "raw_response": raw_response,
        }
    except Exception as exc:
        plan = fallback_ai_plan(goal_data)
        plan["raw_response"] = str(exc)
        return plan


def refine_goal(raw_goal: str) -> dict:
    """Refine a vague goal into a measurable enterprise goal."""
    if not settings.GEMINI_API_KEY:
        return {
            "refined_title": raw_goal.strip()[:80],
            "refined_description": f"Achieve measurable progress on: {raw_goal}",
            "suggested_target": "Define a specific quantifiable target",
            "source": "fallback",
        }

    prompt = refine_goal_prompt(raw_goal)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Strip markdown code fences
        clean = raw
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        parsed = json.loads(clean)
        return {
            "refined_title": parsed.get("refined_title", raw_goal[:80]),
            "refined_description": parsed.get("refined_description", ""),
            "suggested_target": parsed.get("suggested_target", ""),
            "source": "gemini",
        }
    except Exception:
        return {
            "refined_title": raw_goal.strip()[:80],
            "refined_description": f"Achieve measurable progress on: {raw_goal}",
            "suggested_target": "Define a specific quantifiable target",
            "source": "fallback",
        }


def ai_buddy_chat(query: str, context: str) -> dict:
    """Chat with Ai Buddy."""
    if not settings.GEMINI_API_KEY:
        lowered = query.lower()
        if "risk" in lowered or "block" in lowered:
            response = (
                "Local AI fallback: review the highest-risk goal first, identify the blocker owner, "
                "and create one next action that can be completed this week. If progress is below 50%, "
                "schedule a manager check-in before the next deadline."
            )
        elif "summary" in lowered or "team" in lowered:
            response = (
                "Local AI fallback: the team summary should focus on goal progress, overdue milestones, "
                "and high-risk work. Celebrate goals with steady updates, then call out the one area that "
                "needs manager support."
            )
        else:
            response = (
                "Local AI fallback: break the goal into weekly milestones, define one measurable success "
                "metric, and review progress every Friday. No external API key is required for this guidance."
            )
        return {
            "response": response,
            "source": "fallback"
        }

    prompt = ai_buddy_prompt(query, context)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(prompt)
        
        return {
            "response": response.text.strip(),
            "source": "gemini"
        }
    except Exception as exc:
        return {
            "response": f"Ai Buddy encountered an error: {str(exc)}",
            "source": "fallback"
        }
