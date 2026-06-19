import json
from typing import Any, List, Dict
import httpx

from app.core.config import settings

def fallback_auto_assign(task_data: dict, available_users: list[dict]) -> dict:
    if not available_users:
        return {"assigned_user_id": None, "reason": "No users available for assignment."}
    
    # Just pick the first user for fallback
    best_user = available_users[0]
    return {
        "assigned_user_id": best_user["id"],
        "reason": f"Fallback assignment: Selected {best_user['name']} as they were the first available."
    }

async def generate_auto_assignment(task_data: dict, available_users: list[dict], api_key: str | None = None) -> dict:
    """
    Takes a task definition and a list of available users (with their skills/proficiencies)
    and asks the AI to select the best fit. Supports both Gemini and Local Ollama.
    """
    import os
    
    use_local_ai = os.getenv("USE_LOCAL_AI", "false").lower() == "true"
    ollama_host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
    ollama_model = os.getenv("OLLAMA_MODEL", "gemma2:2b")
    
    active_key = api_key or settings.GEMINI_API_KEY
    if not active_key and not use_local_ai:
        return fallback_auto_assign(task_data, available_users)
        
    prompt = f"""
    You are an AI Workforce Manager. Your job is to assign a specific task to the best employee based on their skills.
    
    Task Information:
    Title: {task_data.get('title')}
    Description: {task_data.get('description', 'N/A')}
    Required Skills: {task_data.get('required_skills', 'N/A')}
    
    Available Employees:
    """
    
    for u in available_users:
        skills_str = ", ".join([f"{s['name']} (Level {s['proficiency']})" for s in u.get('skills', [])])
        prompt += f"- ID: {u['id']}, Name: {u['name']}, Skills: {skills_str}\n"
        
    prompt += """
    Based on the above, select the single best employee ID for the task.
    Return ONLY a valid JSON response in the following exact format:
    {
      "assigned_user_id": 123,
      "reason": "Explanation of why this user is the best fit."
    }
    """
    
    try:
        async with httpx.AsyncClient() as client:
            if use_local_ai:
                # -----------------------
                # OLLAMA LOCAL AI ROUTING
                # -----------------------
                url = f"{ollama_host.rstrip('/')}/api/generate"
                payload = {
                    "model": ollama_model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                }
                response = await client.post(url, json=payload, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                text = data.get("response", "{}")
            else:
                # -----------------------
                # GEMINI CLOUD AI ROUTING
                # -----------------------
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={active_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2}
                }
                response = await client.post(url, headers=headers, json=payload, timeout=15.0)
                response.raise_for_status()
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Clean markdown formatting if present
            if text.startswith("```json"):
                text = text.strip("```json").strip("```").strip()
            elif text.startswith("```"):
                text = text.strip("```").strip()
                
            result = json.loads(text)
            
            # Ensure assigned_user_id is an integer or None
            assigned_id = result.get("assigned_user_id")
            if assigned_id is not None and not isinstance(assigned_id, int):
                try:
                    result["assigned_user_id"] = int(assigned_id)
                except ValueError:
                    result["assigned_user_id"] = None
            
            return result
    except Exception as e:
        print(f"Error calling AI for auto assignment ({'Ollama' if use_local_ai else 'Gemini'}): {e}")
        return fallback_auto_assign(task_data, available_users)
