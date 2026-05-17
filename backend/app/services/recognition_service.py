"""Recognition service — badge awarding, streak tracking, AI appreciation."""

from datetime import datetime, timezone, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.checkin import Checkin
from app.models.recognition import Badge, Streak, LeaderboardEntry
from app.models.user import User


# ── Badge definitions ──
BADGE_DEFS = {
    "first_goal": {"title": "First Steps", "icon": "🎯", "desc": "Created your first goal"},
    "goal_crusher": {"title": "Goal Crusher", "icon": "💪", "desc": "Completed 5 goals"},
    "streak_7": {"title": "Weekly Warrior", "icon": "🔥", "desc": "7-day update streak"},
    "streak_30": {"title": "Monthly Master", "icon": "🌟", "desc": "30-day update streak"},
    "milestone_master": {"title": "Milestone Master", "icon": "🏗️", "desc": "Completed 20 milestones"},
    "consistency_king": {"title": "Consistency King", "icon": "👑", "desc": "95%+ consistency score"},
    "early_finisher": {"title": "Early Finisher", "icon": "⚡", "desc": "Completed a goal ahead of deadline"},
    "top_performer": {"title": "Top Performer", "icon": "🏆", "desc": "Ranked #1 in a period"},
    "team_player": {"title": "Team Player", "icon": "🤝", "desc": "Contributed to 3 shared goals"},
    "ai_adopter": {"title": "AI Adopter", "icon": "🤖", "desc": "Used AI features 10+ times"},
}


async def check_and_award_badges(db: AsyncSession, user_id: int) -> list[dict]:
    """Check all badge conditions and award any newly earned badges."""
    awarded = []

    # Get existing badges
    existing_result = await db.execute(
        select(Badge.badge_type).where(Badge.user_id == user_id)
    )
    existing_types = set(existing_result.scalars().all())

    # ── first_goal ──
    if "first_goal" not in existing_types:
        goal_count = await db.execute(
            select(func.count()).select_from(Goal).where(Goal.user_id == user_id)
        )
        if (goal_count.scalar() or 0) >= 1:
            awarded.append(await _award_badge(db, user_id, "first_goal"))

    # ── goal_crusher ──
    if "goal_crusher" not in existing_types:
        completed = await db.execute(
            select(func.count()).select_from(Goal).where(
                Goal.user_id == user_id, Goal.status == "completed"
            )
        )
        if (completed.scalar() or 0) >= 5:
            awarded.append(await _award_badge(db, user_id, "goal_crusher"))

    # ── milestone_master ──
    if "milestone_master" not in existing_types:
        ms_result = await db.execute(
            select(func.count())
            .select_from(Milestone)
            .join(Goal, Milestone.goal_id == Goal.id)
            .where(Goal.user_id == user_id, Milestone.is_completed == True)
        )
        if (ms_result.scalar() or 0) >= 20:
            awarded.append(await _award_badge(db, user_id, "milestone_master"))

    # ── early_finisher ──
    if "early_finisher" not in existing_types:
        goals_result = await db.execute(
            select(Goal).where(Goal.user_id == user_id, Goal.status == "completed")
        )
        for goal in goals_result.scalars().all():
            if goal.deadline and goal.progress >= 100:
                # Check if completed before deadline
                try:
                    dl = datetime.strptime(goal.deadline[:10], "%Y-%m-%d")
                    if datetime.now() < dl:
                        awarded.append(await _award_badge(db, user_id, "early_finisher"))
                        break
                except ValueError:
                    pass

    return [b for b in awarded if b is not None]


async def _award_badge(db: AsyncSession, user_id: int, badge_type: str) -> dict:
    """Create a badge entry."""
    defn = BADGE_DEFS.get(badge_type, {"title": badge_type, "icon": "🏅", "desc": ""})
    badge = Badge(
        user_id=user_id,
        badge_type=badge_type,
        title=defn["title"],
        description=defn["desc"],
        icon=defn["icon"],
    )
    db.add(badge)
    await db.flush()
    await db.refresh(badge)
    return {
        "id": badge.id,
        "badge_type": badge.badge_type,
        "title": badge.title,
        "icon": badge.icon,
        "description": badge.description,
        "earned_at": str(badge.earned_at),
    }


async def update_streak(db: AsyncSession, user_id: int, streak_type: str = "daily_update") -> dict:
    """Update or create a streak for a user."""
    result = await db.execute(
        select(Streak).where(
            Streak.user_id == user_id,
            Streak.streak_type == streak_type,
        )
    )
    streak = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)

    if streak:
        if streak.last_activity:
            delta = (now - streak.last_activity).days
            if delta <= 1:
                streak.current_count += 1
            elif delta > 1:
                streak.current_count = 1  # Reset
        else:
            streak.current_count = 1

        streak.best_count = max(streak.best_count, streak.current_count)
        streak.last_activity = now
        streak.is_active = True
    else:
        streak = Streak(
            user_id=user_id,
            streak_type=streak_type,
            current_count=1,
            best_count=1,
            last_activity=now,
            is_active=True,
        )
        db.add(streak)

    await db.flush()
    await db.refresh(streak)

    # Check streak badges
    existing = await db.execute(
        select(Badge.badge_type).where(Badge.user_id == user_id)
    )
    existing_types = set(existing.scalars().all())

    if streak.current_count >= 7 and "streak_7" not in existing_types:
        await _award_badge(db, user_id, "streak_7")
    if streak.current_count >= 30 and "streak_30" not in existing_types:
        await _award_badge(db, user_id, "streak_30")

    return {
        "streak_type": streak.streak_type,
        "current_count": streak.current_count,
        "best_count": streak.best_count,
        "is_active": streak.is_active,
    }


async def get_user_badges(db: AsyncSession, user_id: int) -> list[dict]:
    """Get all badges for a user."""
    result = await db.execute(
        select(Badge).where(Badge.user_id == user_id).order_by(Badge.earned_at.desc())
    )
    badges = result.scalars().all()
    return [
        {
            "id": b.id,
            "badge_type": b.badge_type,
            "title": b.title,
            "icon": b.icon,
            "description": b.description,
            "earned_at": str(b.earned_at),
        }
        for b in badges
    ]


async def get_user_streaks(db: AsyncSession, user_id: int) -> list[dict]:
    """Get all streaks for a user."""
    result = await db.execute(
        select(Streak).where(Streak.user_id == user_id)
    )
    streaks = result.scalars().all()
    return [
        {
            "streak_type": s.streak_type,
            "current_count": s.current_count,
            "best_count": s.best_count,
            "is_active": s.is_active,
            "last_activity": str(s.last_activity) if s.last_activity else None,
        }
        for s in streaks
    ]
