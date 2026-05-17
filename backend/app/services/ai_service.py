"""AI service – orchestrates Gemini calls and stores results."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.gemini_client import generate_ai_plan
from app.models.goal import Goal
from app.models.user import User
from app.services.milestone_service import bulk_create_milestones


async def generate_and_store_plan(db: AsyncSession, goal: Goal) -> dict:
    """
    Call the AI to generate milestones + recommendations, then persist
    the milestones and recommendation on the goal row.
    """
    goal_data = {
        "title": goal.title,
        "description": goal.description or "",
        "target": goal.target or "",
        "deadline": goal.deadline or "",
    }

    plan = generate_ai_plan(goal_data)

    # Persist milestones
    if plan.get("milestones"):
        await bulk_create_milestones(
            db,
            goal.id,
            plan["milestones"],
            source=plan.get("source", "ai"),
        )

    # Persist recommendation on the goal
    if plan.get("recommendation"):
        goal.ai_recommendation = plan["recommendation"]

    if plan.get("risk"):
        goal.risk = plan["risk"]

    await db.flush()
    await db.refresh(goal)

    return plan


def generate_plan_stateless(goal_data: dict) -> dict:
    """Generate a plan without persisting – for the public endpoint."""
    return generate_ai_plan(goal_data)


async def get_copilot_context(db: AsyncSession, user: User) -> str:
    """Constructs a string representing the user's goals and checkins."""
    # Get all goals for the user, with their checkins
    result = await db.execute(
        select(Goal)
        .where(Goal.user_id == user.id)
        .options(selectinload(Goal.checkins))
    )
    goals = result.scalars().all()
    
    if not goals:
        return f"{user.name} currently has no active goals."
        
    context = [f"User Name: {user.name}", f"Role: {user.role}", "--- ACTIVE GOALS ---"]
    for g in goals:
        ctx = f"- Goal: {g.title} (Status: {g.status}, Progress: {g.progress}%, Risk: {g.risk})"
        if g.deadline:
            ctx += f", Deadline: {g.deadline}"
        
        checkin_texts = []
        for c in g.checkins[-3:]: # Get last 3 checkins
            checkin_texts.append(f"  * Checkin ({c.created_at.strftime('%Y-%m-%d')}): {c.notes or 'No notes'}")
            
        if checkin_texts:
            ctx += "\n" + "\n".join(checkin_texts)
            
        context.append(ctx)
        
    return "\n".join(context)
