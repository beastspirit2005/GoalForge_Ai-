"""AI-powered risk analyzer."""

import json
from datetime import datetime

from app.core.config import settings
from app.ai.prompt_templates import risk_analysis_prompt
from app.logic.scoring_logic import score_risk


def analyze_risk(
    title: str,
    progress: float,
    deadline: datetime | None,
    goal_count: int,
) -> dict:
    """Analyze goal risk using AI or fallback heuristic."""
    # Always compute the heuristic score
    heuristic_risk = score_risk(progress, deadline, goal_count)

    if not settings.GEMINI_API_KEY:
        return {"risk": heuristic_risk, "reason": "Heuristic-based analysis", "source": "fallback"}

    deadline_str = deadline.strftime("%Y-%m-%d") if deadline else "None"
    prompt = risk_analysis_prompt(title, progress, deadline_str, goal_count)

    try:
        import google.generativeai as genai

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        raw = response.text.strip()
        parsed = json.loads(raw)
        return {
            "risk": parsed.get("risk", heuristic_risk),
            "reason": parsed.get("reason", ""),
            "source": "gemini",
        }
    except Exception:
        return {"risk": heuristic_risk, "reason": "Heuristic-based analysis", "source": "fallback"}
