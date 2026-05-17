"""Performance Intelligence Service — compute and query performance scores."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkin import Checkin
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.performance_score import PerformanceScore
from app.models.user import User


async def calculate_user_score(db: AsyncSession, user_id: int, period_type: str, period_label: str) -> PerformanceScore:
    """
    Compute a comprehensive performance score for a user in a given period.

    Scoring formula:
      - Milestone completion rate (25%): completed / total milestones
      - Consistency score (20%): regularity of check-ins and updates
      - Productivity score (25%): weighted goal progress
      - Update frequency (10%): how often progress is logged
      - Planned vs actual (15%): target achievement accuracy
      - Progress growth (5%): improvement trajectory
    """
    # ── Fetch user goals ──
    goals_result = await db.execute(
        select(Goal).where(Goal.user_id == user_id)
    )
    goals = list(goals_result.scalars().all())

    if not goals:
        score = PerformanceScore(
            user_id=user_id,
            period_type=period_type,
            period_label=period_label,
            overall_score=0.0,
        )
        db.add(score)
        await db.flush()
        await db.refresh(score)
        return score

    # ── Milestone completion rate (25%) ──
    total_milestones = 0
    completed_milestones = 0
    for goal in goals:
        ms_result = await db.execute(
            select(Milestone).where(Milestone.goal_id == goal.id)
        )
        milestones = list(ms_result.scalars().all())
        total_milestones += len(milestones)
        completed_milestones += sum(1 for m in milestones if m.is_completed)

    milestone_rate = (completed_milestones / total_milestones * 100) if total_milestones > 0 else 0

    # ── Consistency score (20%) ──
    checkin_result = await db.execute(
        select(func.count()).select_from(Checkin).where(Checkin.user_id == user_id)
    )
    checkin_count = checkin_result.scalar() or 0
    # Score: 100 if >= 1 check-in per goal, scales linearly
    expected_checkins = len(goals)
    consistency = min(100, (checkin_count / max(expected_checkins, 1)) * 100)

    # ── Productivity score (25%) ──
    # Weighted average of goal progress by weightage
    total_weight = sum(g.weightage for g in goals)
    if total_weight > 0:
        productivity = sum(g.progress * g.weightage for g in goals) / total_weight
    else:
        productivity = sum(g.progress for g in goals) / len(goals)

    # ── Update frequency (10%) ──
    # Based on how many goals have been updated recently
    recent_updates = sum(1 for g in goals if g.progress > 0)
    update_freq = (recent_updates / len(goals)) * 100

    # ── Planned vs actual (15%) ──
    # Compare target achievement: use check-in actual_achievement vs goal progress
    pva_scores = []
    for goal in goals:
        ci_result = await db.execute(
            select(Checkin)
            .where(Checkin.goal_id == goal.id)
            .order_by(Checkin.created_at.desc())
            .limit(1)
        )
        latest_checkin = ci_result.scalar_one_or_none()
        if latest_checkin:
            # How close is actual to planned (progress)?
            target_progress = goal.progress
            actual = latest_checkin.actual_achievement
            if target_progress > 0:
                pva_scores.append(min(100, (actual / target_progress) * 100))
            else:
                pva_scores.append(100 if actual > 0 else 50)
        else:
            pva_scores.append(50)  # Neutral if no check-in

    planned_vs_actual = sum(pva_scores) / len(pva_scores) if pva_scores else 50

    # ── Progress growth (5%) ──
    # Simple: goals with progress > 50% indicate growth
    growing = sum(1 for g in goals if g.progress > 50)
    growth_rate = (growing / len(goals)) * 100

    # ── Overall score (weighted) ──
    overall = (
        milestone_rate * 0.25
        + consistency * 0.20
        + productivity * 0.25
        + update_freq * 0.10
        + planned_vs_actual * 0.15
        + growth_rate * 0.05
    )

    # ── Persist ──
    # Check if score already exists for this period
    existing = await db.execute(
        select(PerformanceScore).where(
            PerformanceScore.user_id == user_id,
            PerformanceScore.period_type == period_type,
            PerformanceScore.period_label == period_label,
        )
    )
    score = existing.scalar_one_or_none()

    if score:
        score.milestone_completion_rate = round(milestone_rate, 1)
        score.consistency_score = round(consistency, 1)
        score.productivity_score = round(productivity, 1)
        score.update_frequency = round(update_freq, 1)
        score.planned_vs_actual = round(planned_vs_actual, 1)
        score.progress_growth = round(growth_rate, 1)
        score.overall_score = round(overall, 1)
    else:
        score = PerformanceScore(
            user_id=user_id,
            period_type=period_type,
            period_label=period_label,
            milestone_completion_rate=round(milestone_rate, 1),
            consistency_score=round(consistency, 1),
            productivity_score=round(productivity, 1),
            update_frequency=round(update_freq, 1),
            planned_vs_actual=round(planned_vs_actual, 1),
            progress_growth=round(growth_rate, 1),
            overall_score=round(overall, 1),
        )
        db.add(score)

    await db.flush()
    await db.refresh(score)
    return score


async def get_user_scores(db: AsyncSession, user_id: int) -> list[PerformanceScore]:
    """Get all performance scores for a user."""
    result = await db.execute(
        select(PerformanceScore)
        .where(PerformanceScore.user_id == user_id)
        .order_by(PerformanceScore.created_at.desc())
    )
    return list(result.scalars().all())


async def get_leaderboard(db: AsyncSession, period_type: str, period_label: str) -> list[dict]:
    """Get ranked leaderboard for a period."""
    result = await db.execute(
        select(PerformanceScore, User.name, User.department)
        .join(User, PerformanceScore.user_id == User.id)
        .where(
            PerformanceScore.period_type == period_type,
            PerformanceScore.period_label == period_label,
        )
        .order_by(PerformanceScore.overall_score.desc())
    )
    rows = result.all()

    leaderboard = []
    for rank, (score, name, dept) in enumerate(rows, 1):
        leaderboard.append({
            "rank": rank,
            "user_id": score.user_id,
            "name": name,
            "department": dept,
            "overall_score": score.overall_score,
            "milestone_completion_rate": score.milestone_completion_rate,
            "consistency_score": score.consistency_score,
            "productivity_score": score.productivity_score,
            "is_top_performer": rank == 1,
        })
    return leaderboard


async def calculate_all_scores(db: AsyncSession, period_type: str, period_label: str) -> list[dict]:
    """Calculate scores for all active users and return leaderboard."""
    users_result = await db.execute(
        select(User).where(User.is_active == True)
    )
    users = list(users_result.scalars().all())

    for user in users:
        await calculate_user_score(db, user.id, period_type, period_label)

    return await get_leaderboard(db, period_type, period_label)


async def get_employee_of_period(db: AsyncSession, period_type: str, period_label: str) -> dict | None:
    """Get the top performer for a given period."""
    result = await db.execute(
        select(PerformanceScore, User.name, User.department)
        .join(User, PerformanceScore.user_id == User.id)
        .where(
            PerformanceScore.period_type == period_type,
            PerformanceScore.period_label == period_label,
        )
        .order_by(PerformanceScore.overall_score.desc())
        .limit(1)
    )
    row = result.first()
    if not row:
        return None

    score, name, dept = row
    return {
        "user_id": score.user_id,
        "name": name,
        "department": dept,
        "overall_score": score.overall_score,
        "period_type": period_type,
        "period_label": period_label,
        "title": _period_title(period_type),
    }


def _period_title(period_type: str) -> str:
    return {
        "monthly": "🏆 Employee of the Month",
        "quarterly": "📈 Quarterly Top Performer",
        "yearly": "👑 Employee of the Year",
    }.get(period_type, "Top Performer")
