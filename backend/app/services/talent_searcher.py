"""Talent Searcher — search employees by skills with dynamic ranking."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.skill import Skill, UserSkill


async def search_talent(
    db: AsyncSession,
    skill_names: list[str],
    min_proficiency: float = 0.0,
    department: str | None = None,
    limit: int = 20,
) -> dict:
    """Search employees by skills, ranked by aggregate proficiency."""
    if not skill_names:
        return {"results": [], "message": "No skills provided"}

    # Get all active employees
    query = select(User).where(User.is_active == True, User.role.in_(["employee", "team_lead"]))
    if department:
        query = query.where(User.department == department)

    users_result = await db.execute(query)
    users = list(users_result.scalars().all())

    # Score each user
    scored_users = []

    for user in users:
        skills_result = await db.execute(
            select(Skill.name, UserSkill.proficiency, UserSkill.confidence_score)
            .join(UserSkill, UserSkill.skill_id == Skill.id)
            .where(UserSkill.user_id == user.id)
        )
        user_skills = {name.lower(): {"proficiency": prof, "confidence": conf}
                       for name, prof, conf in skills_result.all()}

        # Calculate match
        matched_skills = []
        total_score = 0.0

        for req_skill in skill_names:
            req_lower = req_skill.strip().lower()
            if req_lower in user_skills:
                skill_data = user_skills[req_lower]
                prof = skill_data["proficiency"]
                conf = skill_data["confidence"]

                if prof >= min_proficiency:
                    composite = prof * conf  # proficiency × confidence
                    matched_skills.append({
                        "skill": req_skill,
                        "proficiency": round(prof, 1),
                        "confidence": round(conf, 2),
                        "composite_score": round(composite, 1),
                    })
                    total_score += composite

        if matched_skills:
            scored_users.append({
                "user_id": user.id,
                "name": user.name,
                "department": user.department,
                "matched_skills": matched_skills,
                "match_count": len(matched_skills),
                "total_count": len(skill_names),
                "match_percentage": round(len(matched_skills) / len(skill_names) * 100, 1),
                "aggregate_score": round(total_score, 1),
            })

    # Sort by aggregate score
    scored_users.sort(key=lambda x: x["aggregate_score"], reverse=True)

    return {
        "query_skills": skill_names,
        "total_matches": len(scored_users),
        "results": scored_users[:limit],
    }
