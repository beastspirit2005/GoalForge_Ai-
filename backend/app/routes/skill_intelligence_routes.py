from __future__ import annotations
"""Skill Intelligence Routes — skill profiles, resume upload, learning recommendations."""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.models.skill import Skill, UserSkill
from app.services.resume_parser import parse_resume
from app.services.skill_confidence_calculator import compute_verified_confidence

router = APIRouter(prefix="/skills", tags=["Skill Intelligence"])


@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload resume file, parse skills semantically using AI, and store extracted text."""
    # Validate file size (max 5MB)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")

    # Resolve AI settings from current user
    provider = getattr(current_user, "preferred_ai_provider", "gemini")
    model = getattr(current_user, "preferred_ai_model", "gemini-2.5-flash")

    # Parse resume
    parsed = await parse_resume(
        content=file_bytes,
        filename=file.filename,
        provider=provider,
        model=model
    )

    # Store extracted text
    extracted_text = parsed.get("extracted_text", "")
    if extracted_text:
        current_user.resume_text_encrypted = extracted_text.encode("utf-8")

    # Update experience years if found
    if parsed.get("experience_years") is not None:
        current_user.experience_years = parsed["experience_years"]

    # Add extracted skills
    skills_added = []
    for skill_data in parsed.get("extracted_skills", []):
        # Find or create skill
        skill_result = await db.execute(
            select(Skill).where(Skill.name.ilike(skill_data["name"]))
        )
        skill = skill_result.scalar_one_or_none()

        if not skill:
            skill = Skill(name=skill_data["name"])
            db.add(skill)
            await db.flush()
            await db.refresh(skill)

        # Add or update user skill
        us_result = await db.execute(
            select(UserSkill).where(
                UserSkill.user_id == current_user.id,
                UserSkill.skill_id == skill.id,
            )
        )
        user_skill = us_result.scalar_one_or_none()

        if user_skill:
            # Update if resume confidence is higher
            if user_skill.base_source != "resume":
                user_skill.confidence_score = max(user_skill.confidence_score, skill_data["confidence"])
        else:
            user_skill = UserSkill(
                user_id=current_user.id,
                skill_id=skill.id,
                proficiency=50.0,  # Default proficiency from resume
                confidence_score=skill_data["confidence"],
                base_source="resume",
            )
            db.add(user_skill)

        skills_added.append(skill_data["name"])

    await db.flush()

    return {
        "message": "Resume processed successfully",
        "skills_extracted": len(parsed.get("extracted_skills", [])),
        "skills_added": skills_added,
        "experience_years": parsed.get("experience_years"),
        "parsed_by": parsed.get("parsed_by"),
    }


@router.get("/profile/{user_id}")
async def skill_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get verified skill profile for a user."""
    # Get user's skills
    result = await db.execute(
        select(Skill.name, UserSkill.proficiency, UserSkill.confidence_score, UserSkill.base_source)
        .join(UserSkill, UserSkill.skill_id == Skill.id)
        .where(UserSkill.user_id == user_id)
    )
    skills = result.all()

    profile = []
    for name, proficiency, confidence, source in skills:
        verified = await compute_verified_confidence(db, user_id, name, resume_confidence=confidence)
        profile.append({
            "skill_name": name,
            "proficiency": round(proficiency, 1),
            "base_source": source,
            "verified_confidence": verified["final_confidence_score"],
            "confidence_percentage": verified["confidence_percentage"],
            "breakdown": verified,
        })

    # Sort by confidence
    profile.sort(key=lambda x: x["verified_confidence"], reverse=True)

    return {
        "user_id": user_id,
        "total_skills": len(profile),
        "skills": profile,
    }


@router.get("/learning-recommendations/{user_id}")
async def learning_recommendations(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get learning recommendations based on skill gaps."""
    from app.models.target import Task

    # Get user's current skills
    skills_result = await db.execute(
        select(Skill.name)
        .join(UserSkill, UserSkill.skill_id == Skill.id)
        .where(UserSkill.user_id == user_id)
    )
    user_skill_names = {name.lower() for name in skills_result.scalars().all()}

    # Get skills required by user's tasks
    tasks_result = await db.execute(
        select(Task).where(Task.assigned_to == user_id, Task.status.in_(["pending", "assigned", "active"]))
    )
    tasks = list(tasks_result.scalars().all())

    required_skills = set()
    for task in tasks:
        if task.required_skills:
            for s in task.required_skills.split(","):
                required_skills.add(s.strip())

    # Find gaps
    recommendations = []
    for req_skill in required_skills:
        if req_skill.lower() not in user_skill_names:
            # Find a related skill the user has
            related = None
            for user_skill in user_skill_names:
                if user_skill in req_skill.lower() or req_skill.lower() in user_skill:
                    related = user_skill
                    break

            recommendation = {
                "required_skill": req_skill,
                "has_related_skill": related,
                "recommendation": f"Learn {req_skill} basics" + (f" (you already know {related})" if related else ""),
                "priority": "high" if not related else "medium",
            }
            recommendations.append(recommendation)

    recommendations.sort(key=lambda x: 0 if x["priority"] == "high" else 1)

    return {
        "user_id": user_id,
        "total_recommendations": len(recommendations),
        "recommendations": recommendations,
    }
