import json
import asyncio
import httpx
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


def generate_ai_plan(goal_data, api_key: str | None = None):
    active_key = api_key or settings.GEMINI_API_KEY
    if not active_key:
        return fallback_ai_plan(goal_data)

    prompt = milestone_prompt(
        goal_data.get("title", ""),
        goal_data.get("description", ""),
        goal_data.get("target", ""),
        goal_data.get("deadline", ""),
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=active_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash"
        )
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


def refine_goal(raw_goal: str, api_key: str | None = None) -> dict:
    """Refine a vague goal into a measurable enterprise goal."""
    active_key = api_key or settings.GEMINI_API_KEY
    if not active_key:
        return {
            "refined_title": raw_goal.strip()[:80],
            "refined_description": f"Achieve measurable progress on: {raw_goal}",
            "suggested_target": "Define a specific quantifiable target",
            "source": "fallback",
        }

    prompt = refine_goal_prompt(raw_goal)

    try:
        import google.generativeai as genai

        genai.configure(api_key=active_key)
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash"
        )
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


import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")


async def get_ollama_models() -> list[str]:
    """Fetch the list of pulled models from the local Ollama API."""
    url = f"{OLLAMA_HOST}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(url)
            if res.status_code == 200:
                models = res.json().get("models", [])
                return [m.get("name", "") for m in models if m.get("name")]
    except Exception:
        pass
    return []


async def get_ollama_model() -> str:
    """Select the first active Ollama model or return fallback 'llama3'."""
    models = await get_ollama_models()
    if models:
        return models[0]
    return "llama3"


async def call_ollama(prompt: str, model: str) -> str:
    """Call the local Ollama generate API."""
    url = f"{OLLAMA_HOST}/api/generate"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            res = await client.post(url, json={
                "model": model,
                "prompt": prompt,
                "stream": False
            })
            if res.status_code == 200:
                return res.json().get("response", "").strip()
            else:
                raise Exception(f"Ollama returned status code {res.status_code}")
    except Exception as exc:
        raise Exception(f"Failed to connect to local Ollama at {url}: {str(exc)}")


async def ai_buddy_chat(query: str, context: str, provider: str = "gemini", model: str | None = None, api_key: str | None = None) -> dict:
    """Chat with Ai Buddy using the specified provider ('gemini' | 'ollama' | 'fallback')."""
    if provider == "ollama":
        try:
            # If no model is explicitly passed, find the first available model
            selected_model = model
            if not selected_model:
                selected_model = await get_ollama_model()
            
            prompt = ai_buddy_prompt(query, context)
            response = await call_ollama(prompt, selected_model)
            return {
                "response": response,
                "source": f"ollama ({selected_model})"
            }
        except Exception as exc:
            return {
                "response": (
                    f"Error connecting to local Ollama: {str(exc)}.\n\n"
                    "Please verify that:\n"
                    "1. Ollama is installed and running (`ollama serve`)\n"
                    "2. You have pulled a lightweight model (e.g. `ollama pull gemma2:2b` or `ollama pull phi3:mini`)\n\n"
                    "Would you like to try the **Offline Fallback** instead?"
                ),
                "source": "error-ollama"
            }
            
    elif provider == "fallback":
        lowered = query.lower()
        if "risk" in lowered or "block" in lowered:
            response = (
                "**Offline Fallback Advice (Risk & Blockers)**:\n\n"
                "- **Review High-Risk Work**: Identify goals with progress significantly behind schedule.\n"
                "- **Isolate Blockers**: Determine if the issue is resource constraints, technical hurdles, or third-party dependencies.\n"
                "- **Define a Next Action**: Outline one single, measurable task to execute by the end of this week to reduce risk.\n"
                "- **Update Manager & Log Check-ins**: Clear communications in check-ins prevent deadline surprises."
            )
        elif "summary" in lowered or "team" in lowered:
            response = (
                "**Offline Fallback Advice (Team Performance)**:\n\n"
                "- **Compare Team Progress**: Benchmark active goal completion rates across team members.\n"
                "- **Track Check-in Streaks**: Celebrate team members with high check-in consistency.\n"
                "- **Address Critical Areas**: Focus immediate support on high-risk milestones.\n"
                "- **Routine Review**: Host quick Friday check-ins to unlock stuck milestones."
            )
        else:
            response = (
                "**Offline Fallback Advice (Goal Execution)**:\n\n"
                "- **Milestone Strategy**: Always divide a target goal into 3 to 5 smaller, measurable milestones.\n"
                "- **UOM Metrics**: Focus on highly quantifiable targets (e.g. '$10K revenue' or '5 code reviews') rather than vague statements.\n"
                "- **Bi-weekly Check-ins**: Check-in twice a week with concise actual accomplishments to maintain strong momentum."
            )
        return {
            "response": response,
            "source": "fallback"
        }
        
    else:  # Default: gemini
        active_key = api_key or settings.GEMINI_API_KEY
        if not active_key:
            return {
                "response": (
                    "**Gemini API Key Missing**: No API key was found in the configuration.\n\n"
                    "Would you like to switch to **Local Ollama** or use the free **Offline Fallback**?"
                ),
                "source": "error-gemini"
            }
            
        prompt = ai_buddy_prompt(query, context)
        try:
            import google.generativeai as genai
            
            # Use thread pool executor to prevent blocking FastAPI's event loop
            import asyncio
            genai.configure(api_key=active_key)
            gemini_model = genai.GenerativeModel(
                model_name="gemini-2.0-flash"
            )
            response = await asyncio.to_thread(gemini_model.generate_content, prompt)
            
            return {
                "response": response.text.strip(),
                "source": "gemini (your key)" if api_key else "gemini"
            }
        except Exception as exc:
            return {
                "response": (
                    f"**Gemini API Request Failed**: {str(exc)}.\n\n"
                    "Would you like to switch to **Local Ollama** or use the free **Offline Fallback**?"
                ),
                "source": "error-gemini"
            }
