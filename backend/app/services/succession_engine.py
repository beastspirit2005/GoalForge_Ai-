"""Succession Engine — detects single points of failure in skill coverage."""

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.models.target import Task


async def detect_knowledge_risks(
    db: AsyncSession,
    threshold: float = 0.8,
) -> dict:
    """
    Detect skills where a single person handles the majority of work.

    A skill is a SPOF if one employee handles >threshold (default 80%)
    of all tasks requiring that skill.
    """
    # Get all active tasks with required skills
    tasks_result = await db.execute(
        select(Task)
        .options(selectinload(Task.required_skills))
        .where(Task.status.in_(["pending", "assigned", "active", "completed"]))
    )
    tasks = list(tasks_result.scalars().all())

    # Build skill -> assigned user mapping
    skill_user_counts: dict[str, dict[int, int]] = {}
    skill_total_counts: dict[str, int] = {}

    for task in tasks:
        if not task.required_skills or not task.assigned_to:
            continue
        for skill_req in task.required_skills:
            skill_name = skill_req.skill_name
            skill_lower = skill_name.lower()
            if skill_lower not in skill_user_counts:
                skill_user_counts[skill_lower] = {}
                skill_total_counts[skill_lower] = 0

            skill_total_counts[skill_lower] += 1
            user_id = task.assigned_to
            skill_user_counts[skill_lower][user_id] = skill_user_counts[skill_lower].get(user_id, 0) + 1

    # Identify SPOFs
    risks = []
    for skill_name, user_counts in skill_user_counts.items():
        total = skill_total_counts[skill_name]
        if total < 2:
            continue

        for user_id, count in user_counts.items():
            usage_pct = count / total
            if usage_pct >= threshold:
                # This is a SPOF — find backups
                user_result = await db.execute(select(User).where(User.id == user_id))
                primary_user = user_result.scalar_one_or_none()

                # Find other users with this skill
                backup_result = await db.execute(
                    select(User.id, User.name, UserSkill.proficiency)
                    .join(UserSkill, UserSkill.user_id == User.id)
                    .join(Skill, Skill.id == UserSkill.skill_id)
                    .where(
                        Skill.name.ilike(f"%{skill_name}%"),
                        User.id != user_id,
                        User.is_active == True,
                    )
                    .order_by(UserSkill.proficiency.desc())
                    .limit(3)
                )
                backups = [
                    {"user_id": uid, "name": name, "proficiency": round(prof, 1)}
                    for uid, name, prof in backup_result.all()
                ]

                risks.append({
                    "skill_name": skill_name,
                    "primary_owner_id": user_id,
                    "primary_owner_name": primary_user.name if primary_user else "Unknown",
                    "usage_percentage": round(usage_pct * 100, 1),
                    "is_single_point_of_failure": True,
                    "total_tasks_with_skill": total,
                    "backup_candidates": backups,
                    "risk_level": "critical" if not backups else "high",
                })

    risks.sort(key=lambda x: x["usage_percentage"], reverse=True)

    return {
        "total_risks_detected": len(risks),
        "critical_risks": len([r for r in risks if r["risk_level"] == "critical"]),
        "risks": risks,
    }
