"""Skill Confidence Calculator — computes verified confidence scores.

Confidence = (0.30 × Resume) + (0.50 × Completed Tasks) + (0.20 × Goal Milestones)
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.target import Task
from app.models.skill import Skill, UserSkill


async def calculate_task_confidence(db: AsyncSession, user_id: int, skill_name: str) -> float:
    """Calculate task-based confidence for a skill."""
    result = await db.execute(
        select(func.count()).select_from(Task)
        .where(
            Task.assigned_to == user_id,
            Task.status == "completed",
            Task.required_skills.ilike(f"%{skill_name}%"),
        )
    )
    completed_with_skill = result.scalar() or 0

    # Normalize: 3+ completed tasks = full confidence
    return min(1.0, completed_with_skill / 3.0)


async def calculate_milestone_confidence(db: AsyncSession, user_id: int, skill_name: str) -> float:
    """Calculate milestone-based confidence (derived from completed goal milestones)."""
    result = await db.execute(
        select(func.count())
        .select_from(Milestone)
        .join(Goal, Milestone.goal_id == Goal.id)
        .where(
            Goal.user_id == user_id,
            Milestone.is_completed == True,
        )
    )
    completed_milestones = result.scalar() or 0

    # Normalize: 10+ milestones = full confidence
    return min(1.0, completed_milestones / 10.0)


async def compute_verified_confidence(
    db: AsyncSession,
    user_id: int,
    skill_name: str,
    resume_confidence: float = 0.5,
) -> dict:
    """
    Compute the verified confidence score for a user's skill.

    Formula: Confidence = (0.30 × Resume) + (0.50 × Tasks) + (0.20 × Milestones)
    """
    task_conf = await calculate_task_confidence(db, user_id, skill_name)
    milestone_conf = await calculate_milestone_confidence(db, user_id, skill_name)

    final = (
        resume_confidence * 0.30 +
        task_conf * 0.50 +
        milestone_conf * 0.20
    )
    final = round(max(0.0, min(1.0, final)), 4)

    return {
        "skill_name": skill_name,
        "resume_confidence": round(resume_confidence, 4),
        "task_based_confidence": round(task_conf, 4),
        "milestone_confidence": round(milestone_conf, 4),
        "final_confidence_score": final,
        "confidence_percentage": round(final * 100, 1),
    }
