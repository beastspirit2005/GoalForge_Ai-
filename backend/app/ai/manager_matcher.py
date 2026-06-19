"""AI Manager Matcher — scores and ranks managers for target assignments."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.target import Target, Task
from app.models.skill import Skill, UserSkill
from app.models.goal import Goal


async def score_manager_for_target(
    db: AsyncSession,
    manager: User,
    required_skills: list[str],
) -> dict:
    """Score a single manager candidate for a target."""
    reasons = []

    # 1. Skill Fit (40%) — Check team members' skills
    team_result = await db.execute(
        select(User).where(User.manager_id == manager.id)
    )
    team = list(team_result.scalars().all())

    team_skills = set()
    for member in team:
        skills_result = await db.execute(
            select(Skill.name)
            .join(UserSkill, UserSkill.skill_id == Skill.id)
            .where(UserSkill.user_id == member.id)
        )
        member_skills = set(skills_result.scalars().all())
        team_skills.update(member_skills)

    if required_skills:
        matched = sum(1 for s in required_skills if s.strip().lower() in {ts.lower() for ts in team_skills})
        skill_fit = matched / len(required_skills) if required_skills else 0.0
    else:
        skill_fit = 0.5  # Neutral if no skills specified

    if skill_fit > 0.7:
        reasons.append(f"✓ Team covers {matched}/{len(required_skills)} required skills")

    # 2. Completion Rate (25%)
    team_ids = [m.id for m in team]
    if team_ids:
        goals_result = await db.execute(
            select(func.count()).select_from(Goal)
            .where(Goal.user_id.in_(team_ids), Goal.status == "completed")
        )
        completed = goals_result.scalar() or 0

        total_goals_result = await db.execute(
            select(func.count()).select_from(Goal)
            .where(Goal.user_id.in_(team_ids))
        )
        total_goals = total_goals_result.scalar() or 1
    else:
        completed = 0
        total_goals = 1

    completion_rate = completed / max(total_goals, 1)
    if completion_rate > 0.8:
        reasons.append(f"✓ {completion_rate*100:.0f}% team completion rate")

    # 3. Availability (20%)
    active_targets_result = await db.execute(
        select(func.count()).select_from(Target)
        .where(Target.manager_id == manager.id, Target.status == "active")
    )
    active_targets = active_targets_result.scalar() or 0
    max_targets = 5
    availability = max(0.0, 1.0 - (active_targets / max_targets))

    if active_targets <= 2:
        reasons.append(f"✓ Only {active_targets} active target(s)")

    # 4. Track Record (15%)
    completed_targets_result = await db.execute(
        select(func.count()).select_from(Target)
        .where(Target.manager_id == manager.id, Target.status == "completed")
    )
    track_record = min(1.0, (completed_targets_result.scalar() or 0) / 3.0)
    if track_record > 0.5:
        reasons.append("✓ Successfully completed targets before")

    # Composite score
    score = (
        skill_fit * 0.40 +
        completion_rate * 0.25 +
        availability * 0.20 +
        track_record * 0.15
    )

    return {
        "user_id": manager.id,
        "name": manager.name,
        "department": manager.department,
        "score": round(score * 100, 1),
        "factors": {
            "skill_fit": round(skill_fit * 100, 1),
            "completion_rate": round(completion_rate * 100, 1),
            "availability": round(availability * 100, 1),
            "track_record": round(track_record * 100, 1),
        },
        "reasons": reasons,
    }


async def recommend_managers_for_target(
    db: AsyncSession,
    target_id: int,
) -> dict:
    """Rank all managers for a given target."""
    target_result = await db.execute(select(Target).where(Target.id == target_id))
    target = target_result.scalar_one_or_none()
    if not target:
        return {"error": "Target not found"}

    required_skills = [s.strip() for s in (target.required_skills or "").split(",") if s.strip()]

    # Get all managers
    managers_result = await db.execute(
        select(User).where(User.role.in_(["manager", "team_lead"]))
    )
    managers = list(managers_result.scalars().all())

    if not managers:
        return {"target_id": target_id, "recommendations": [], "message": "No managers available"}

    # Score each manager
    scored = []
    for mgr in managers:
        result = await score_manager_for_target(db, mgr, required_skills)
        scored.append(result)

    scored.sort(key=lambda x: x["score"], reverse=True)

    return {
        "target_id": target_id,
        "target_title": target.title,
        "required_skills": required_skills,
        "recommendations": scored[:5],
    }
