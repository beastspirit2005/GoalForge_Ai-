from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role, require_critical_otp
from app.core.database import get_db
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.user import User
from app.schemas.ai_schema import AIGeneratePlanRequest, AIRefineGoalRequest, CopilotRequest, CopilotResponse
from app.services.ai_service import generate_plan_stateless, get_copilot_context
from app.ai.gemini_client import refine_goal, ai_buddy_chat
from app.ai.dynamic_guidance import generate_dynamic_guidance

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/generate-plan")
async def generate_plan(
    data: AIGeneratePlanRequest,
    current_user: User = Depends(get_current_user)
):
    """Public endpoint – generate a plan without persisting."""
    return await generate_plan_stateless(
        data.model_dump(),
        provider=data.provider,
        model=data.model
    )


@router.post("/refine-goal")
async def refine(
    data: AIRefineGoalRequest,
    current_user: User = Depends(get_current_user)
):
    """Refine a vague goal into a measurable enterprise goal."""
    return await refine_goal(
        data.raw_goal,
        provider=data.provider,
        model=data.model
    )


@router.get("/models")
async def get_models():
    """Get list of active pulled local models in Ollama."""
    from app.ai.gemini_client import get_ollama_models
    models = await get_ollama_models()
    return {"models": models}


@router.get("/copilot-context")
async def copilot_context(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return role-based copilot context only (no Gemini call). Used when the client uses a browser-stored API key."""
    context = await get_copilot_context(db, current_user)
    return {"context": context, "role": current_user.role}


@router.post("/copilot", response_model=CopilotResponse)
async def copilot(data: CopilotRequest, request: Request, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Chat with Ai Buddy."""
    context = data.context
    if not context:
        context = await get_copilot_context(db, current_user)
        
    custom_key = request.cookies.get("custom_gemini_key")
    active_key = data.api_key or custom_key
        
    result = await ai_buddy_chat(
        data.query,
        context,
        provider=data.provider,
        model=data.model or current_user.preferred_ai_model,
        api_key=active_key
    )
    return CopilotResponse(**result)

class CustomKeyRequest(BaseModel):
    apiKey: str

@router.post("/key")
async def save_custom_key(
    data: CustomKeyRequest, 
    response: Response,
    current_user: User = Depends(get_current_user)
):
    if not data.apiKey:
        raise HTTPException(status_code=400, detail="Invalid Gemini API key format.")
    from app.core.config import settings
    response.set_cookie(
        key="custom_gemini_key",
        value=data.apiKey.strip(),
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
        max_age=60 * 60 * 24 * 30, # 30 days
        path="/"
    )
    return {"success": True, "message": "API key successfully secured in an httpOnly cookie."}

@router.delete("/key")
async def delete_custom_key(
    response: Response,
    current_user: User = Depends(get_current_user)
):
    response.delete_cookie(
        key="custom_gemini_key",
        path="/"
    )
    return {"success": True, "message": "API key cleared successfully."}


@router.get("/dynamic-guidance/{goal_id}")
async def dynamic_guidance(
    goal_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get adaptive AI guidance for a specific goal based on current state."""
    goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = goal_result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Calculate milestone rate
    ms_result = await db.execute(select(Milestone).where(Milestone.goal_id == goal.id))
    milestones = list(ms_result.scalars().all())
    ms_total = len(milestones)
    ms_done = sum(1 for m in milestones if m.is_completed)
    ms_rate = (ms_done / ms_total * 100) if ms_total > 0 else 0

    # Count user's goals
    from sqlalchemy import func
    gc_result = await db.execute(
        select(func.count()).select_from(Goal).where(Goal.user_id == goal.user_id)
    )
    goal_count = gc_result.scalar() or 0

    guidance = generate_dynamic_guidance(
        goal_title=goal.title,
        progress=goal.progress,
        deadline=goal.deadline,
        milestone_rate=ms_rate,
        goal_count=goal_count,
        risk=goal.risk,
    )
    guidance["goal_id"] = goal.id
    guidance["goal_title"] = goal.title
    return guidance


@router.get("/performance-narrative/{user_id}")
async def performance_narrative(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI performance narrative for a user."""
    from app.services.performance_service import get_user_scores
    scores = await get_user_scores(db, user_id)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id != current_user.id:
        if current_user.role == "admin":
            pass
        elif current_user.role == "manager" and user.manager_id == current_user.id:
            pass
        else:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Build context for AI
    score_summary = ""
    for s in scores[:3]:
        score_summary += f"- {s.period_label}: Overall {s.overall_score}, Productivity {s.productivity_score}, Consistency {s.consistency_score}\n"

    context = f"""
Employee: {user.name} ({user.department or 'N/A'})
Performance Scores:
{score_summary if score_summary else 'No scores calculated yet.'}
"""
    query = f"Write a brief professional performance narrative for {user.name} based on their scores. Highlight strengths and areas for improvement."
    result = await ai_buddy_chat(query, context)
    return {
        "user_id": user_id,
        "name": user.name,
        "narrative": result["response"],
        "source": result["source"],
    }


@router.get("/team-summary")
async def team_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate an AI summary of the manager's team performance."""
    from app.services.goal_service import get_team_goals

    team_goals = await get_team_goals(db, current_user.id)

    # Build context
    team_result = await db.execute(
        select(User).where(User.manager_id == current_user.id)
    )
    team = list(team_result.scalars().all())

    context_parts = [f"Manager: {current_user.name}", f"Team Size: {len(team)}", ""]
    for member in team:
        member_goals = [g for g in team_goals if g.user_id == member.id]
        avg_progress = sum(g.progress for g in member_goals) / max(len(member_goals), 1)
        risk_count = sum(1 for g in member_goals if g.risk.lower() == "high")
        context_parts.append(
            f"- {member.name}: {len(member_goals)} goals, avg progress {avg_progress:.0f}%, {risk_count} high-risk"
        )

    context = "\n".join(context_parts)
    query = "Summarize the team's performance. Identify top performers, areas of concern, and recommended actions."
    result = await ai_buddy_chat(query, context)
    return {
        "summary": result["response"],
        "team_size": len(team),
        "source": result["source"],
    }


class ActionExecutionRequest(BaseModel):
    action: str
    params: dict = {}

@router.post("/execute-action", dependencies=[Depends(require_critical_otp)])
async def execute_action(
    data: ActionExecutionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    """Execute an administrative action prepared by AI Buddy."""
    action = data.action
    params = data.params
    
    if action == "disable_inactive_users":
        from app.models.user import User
        from app.services.audit_service import log_action
        from datetime import datetime, timedelta
        
        days = params.get("days", 90)
        cutoff = datetime.now() - timedelta(days=days)
        
        stmt = select(User).where(User.is_active == True, User.created_at < cutoff, User.role != "super_admin")
        res = await db.execute(stmt)
        users = res.scalars().all()
        
        disabled_emails = []
        for u in users:
            u.is_active = False
            disabled_emails.append(u.email)
            
        await db.flush()
        await db.commit()
        
        await log_action(
            db, user_id=current_user.id, action="disable_inactive_users",
            entity_type="system", entity_id=0,
            new_value={"disabled_count": len(disabled_emails), "emails": disabled_emails}
        )
        return {"success": True, "message": f"Successfully disabled {len(disabled_emails)} inactive accounts.", "details": disabled_emails}
        
    raise HTTPException(status_code=400, detail=f"Unknown admin action: {action}")
