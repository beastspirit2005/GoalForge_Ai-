"""
Prediction Engine — smart heuristic-based predictions that produce realistic results.

Uses statistical analysis of goal data, progress rates, and behavioral patterns
to predict completion probability, burnout risk, and delayed goals.
No ML framework required — pure mathematical heuristics.
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.checkin import Checkin
from app.models.goal import Goal
from app.models.milestone import Milestone
from app.models.user import User


def _days_between(date_str: str | None) -> int | None:
    """Parse date and return days from now. Positive = future, negative = past."""
    if not date_str:
        return None
    for fmt in ("%Y-%m-%d", "%d %b %Y", "%d/%m/%Y"):
        try:
            dl = datetime.strptime(date_str.strip()[:10] if fmt == "%Y-%m-%d" else date_str.strip(), fmt)
            return (dl - datetime.now()).days
        except ValueError:
            continue
    return None


def normalize_progress_rate(actual: float, expected: float, is_overdue: bool) -> float:
    """Returns float in [0, 1]. Penalizes overdue tasks."""
    if expected == 0:
        return 0.0
    ratio = actual / expected
    if is_overdue:
        ratio *= 0.6  # 40% penalty for overdue
    return max(0.0, min(1.0, ratio))


def normalize_workload_pressure(goal_count: int) -> float:
    """Returns float in [0, 1]. Degrades linearly after 6 goals."""
    if goal_count <= 6:
        return 1.0
    # Each goal beyond 6 reduces score by 0.1, floored at 0
    return max(0.0, 1.0 - (goal_count - 6) * 0.1)


def normalize_recency(days_since_update: int) -> float:
    """Returns float in [0, 1]. Stale after 14 days."""
    if days_since_update <= 14:
        return 1.0
    return max(0.0, 1.0 - (days_since_update - 14) / 30)


def normalize_goal_priority(weightage: float) -> float:
    """Returns float in [0, 1]. Higher weightage maps to higher focus/priority."""
    return max(0.0, min(1.0, weightage * 0.04))


def compute_completion_probability(
    progress_rate: float,
    milestone_trajectory: float,
    workload_pressure: float,
    update_recency: float,
    goal_priority: float,
) -> float:
    score = (
        progress_rate       * 0.40 +
        milestone_trajectory * 0.20 +
        workload_pressure   * 0.15 +
        update_recency      * 0.15 +
        goal_priority       * 0.10
    )
    return round(max(0.0, min(1.0, score)), 4)  # Hard clamp


# Burnout risk gradient helper functions
def compute_goal_overload(goal_count: int) -> float:
    """
    Smooth linear/sigmoid gradient for goal overload.
    <= 2 goals: minimal overload (0.1)
    >= 8 goals: max overload (1.0)
    """
    if goal_count <= 2:
        return 0.1
    if goal_count >= 8:
        return 1.0
    return round(0.1 + (goal_count - 2) * 0.15, 4)  # Linear ramp from 0.1 to 1.0


def compute_progress_pressure(avg_progress: float) -> float:
    """
    Smooth gradient for progress pressure.
    High progress (80%+) -> low pressure (0.1)
    Low progress (20%-) -> high pressure (0.9)
    """
    if avg_progress >= 80.0:
        return 0.1
    if avg_progress <= 20.0:
        return 0.9
    return round(0.9 - (avg_progress - 20.0) * (0.8 / 60.0), 4)


def compute_weightage_burden(total_weightage: float) -> float:
    """
    Smooth gradient instead of binary threshold.
    Starts penalizing at 80, maxes out around 140.
    Returns float in [0, 1].
    """
    if total_weightage <= 80:
        return 0.0
    if total_weightage >= 140:
        return 1.0
    return round((total_weightage - 80) / 60.0, 4)  # Linear ramp between 80–140


def compute_checkin_exhaustion(updates_last_7_days: float) -> float:
    """
    Daily updates (7+ in a week) indicate stress or micromanagement.
    """
    return round(min(1.0, max(0.0, updates_last_7_days / 7.0)), 4)


def compute_risk_accumulation(high_risk_goals: int) -> float:
    """
    Smooth accumulation based on number of high-risk goals.
    """
    return round(min(1.0, high_risk_goals * 0.25), 4)


def predict_completion_probability(
    progress: float,
    deadline_str: str | None,
    milestone_completion_rate: float,
    goal_count: int,
    weightage: float,
    days_since_last_update: int = 0,
) -> dict[str, Any]:
    """
    Predict the probability of completing a goal on time.

    Factors:
    1. Progress rate vs time remaining (40%)
    2. Milestone completion trajectory (20%)
    3. Workload pressure (15%)
    4. Update recency — stale goals are riskier (15%)
    5. Weightage — higher weight goals get more attention (10%)
    """
    days_left = _days_between(deadline_str)

    # ── Factor 1: Progress rate (40%) ──
    is_overdue = days_left is not None and days_left <= 0
    if days_left is not None and days_left > 0:
        expected = 100.0 - (days_left / max(days_left + 30, 1) * 100.0)
    else:
        expected = 100.0

    progress_rate = normalize_progress_rate(actual=progress, expected=expected, is_overdue=is_overdue)
    milestone_trajectory = milestone_completion_rate / 100.0
    workload_pressure = normalize_workload_pressure(goal_count)
    update_recency = normalize_recency(days_since_last_update)
    goal_priority = normalize_goal_priority(weightage)

    prob_fraction = compute_completion_probability(
        progress_rate=progress_rate,
        milestone_trajectory=milestone_trajectory,
        workload_pressure=workload_pressure,
        update_recency=update_recency,
        goal_priority=goal_priority,
    )

    probability = round(prob_fraction * 100.0, 1)

    # Risk level
    if probability >= 75:
        risk = "Low"
    elif probability >= 50:
        risk = "Medium"
    else:
        risk = "High"

    factors = [
        {"name": "Progress Rate", "score": round(progress_rate * 100.0, 1), "weight": "40%"},
        {"name": "Milestone Trajectory", "score": round(milestone_trajectory * 100.0, 1), "weight": "20%"},
        {"name": "Workload Balance", "score": round(workload_pressure * 100.0, 1), "weight": "15%"},
        {"name": "Update Recency", "score": round(update_recency * 100.0, 1), "weight": "15%"},
        {"name": "Goal Priority", "score": round(goal_priority * 100.0, 1), "weight": "10%"},
    ]

    return {
        "completion_probability": probability,
        "risk": risk,
        "factors": factors,
        "days_remaining": days_left,
    }


def predict_burnout_risk(
    goal_count: int,
    avg_progress: float,
    total_weightage: float,
    checkin_frequency: float,  # check-ins per week
    high_risk_goals: int,
    days_since_break: int = 0,
) -> dict[str, Any]:
    """
    Predict burnout risk for an employee using smooth gradients.

    Factors:
    1. Goal overload (30%): > 6 goals is high pressure
    2. Progress pressure (25%): low progress across many goals = stress
    3. Weightage burden (15%): total > 100% or heavily skewed
    4. Check-in exhaustion (15%): very frequent updates = potential burnout
    5. Risk accumulation (15%): multiple high-risk goals compound stress
    """
    overload = compute_goal_overload(goal_count)
    pressure = compute_progress_pressure(avg_progress)
    burden = compute_weightage_burden(total_weightage)
    exhaustion = compute_checkin_exhaustion(checkin_frequency)
    risk_accum = compute_risk_accumulation(high_risk_goals)

    burnout_fraction = (
        overload * 0.30
        + pressure * 0.25
        + burden * 0.15
        + exhaustion * 0.15
        + risk_accum * 0.15
    )
    burnout_score = round(max(0.0, min(1.0, burnout_fraction)) * 100.0, 1)

    if burnout_score >= 70:
        level = "High"
        recommendation = "Consider redistributing workload. Recommend manager check-in and deadline extensions for low-priority goals."
    elif burnout_score >= 45:
        level = "Medium"
        recommendation = "Monitor workload balance. Consider focusing on top 3 highest-impact goals this week."
    else:
        level = "Low"
        recommendation = "Workload is balanced. Maintain current pace and celebrate recent progress."

    return {
        "burnout_risk": burnout_score,
        "level": level,
        "recommendation": recommendation,
        "factors": {
            "goal_overload": round(overload * 100.0, 1),
            "progress_pressure": round(pressure * 100.0, 1),
            "weightage_burden": round(burden * 100.0, 1),
            "update_exhaustion": round(exhaustion * 100.0, 1),
            "risk_accumulation": round(risk_accum * 100.0, 1),
        },
    }


async def predict_goal_completion(db: AsyncSession, goal_id: int) -> dict[str, Any]:
    """Full prediction for a single goal."""
    goal_result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = goal_result.scalar_one_or_none()
    if not goal:
        return {"error": "Goal not found"}

    # Milestone completion rate
    ms_result = await db.execute(select(Milestone).where(Milestone.goal_id == goal.id))
    milestones = list(ms_result.scalars().all())
    ms_total = len(milestones)
    ms_done = sum(1 for m in milestones if m.is_completed)
    ms_rate = (ms_done / ms_total * 100) if ms_total > 0 else 0

    # User's goal count
    gc_result = await db.execute(
        select(func.count()).select_from(Goal).where(Goal.user_id == goal.user_id)
    )
    goal_count = gc_result.scalar() or 0

    # Days since last update
    days_since = 0
    if goal.updated_at:
        days_since = max(0, (datetime.now(timezone.utc) - goal.updated_at).days)

    prediction = predict_completion_probability(
        progress=goal.progress,
        deadline_str=goal.deadline,
        milestone_completion_rate=ms_rate,
        goal_count=goal_count,
        weightage=goal.weightage,
        days_since_last_update=days_since,
    )

    prediction["goal_id"] = goal.id
    prediction["goal_title"] = goal.title
    prediction["current_progress"] = goal.progress
    prediction["milestones_completed"] = f"{ms_done}/{ms_total}"
    return prediction


async def predict_user_burnout(db: AsyncSession, user_id: int) -> dict[str, Any]:
    """Full burnout prediction for a user."""
    goals_result = await db.execute(
        select(Goal).where(Goal.user_id == user_id)
    )
    goals = list(goals_result.scalars().all())
    goal_count = len(goals)

    avg_progress = sum(g.progress for g in goals) / max(goal_count, 1)
    total_weightage = sum(g.weightage for g in goals)
    high_risk_goals = sum(1 for g in goals if g.risk.lower() == "high")

    # Check-in frequency (total check-ins / weeks active)
    ci_result = await db.execute(
        select(func.count()).select_from(Checkin).where(Checkin.user_id == user_id)
    )
    checkin_count = ci_result.scalar() or 0
    # Approximate weeks active (assume 4 weeks if no data)
    checkin_freq = checkin_count / 4.0

    return predict_burnout_risk(
        goal_count=goal_count,
        avg_progress=avg_progress,
        total_weightage=total_weightage,
        checkin_frequency=checkin_freq,
        high_risk_goals=high_risk_goals,
    )


async def predict_delayed_goals(db: AsyncSession, user_id: int | None = None) -> list[dict]:
    """Identify goals likely to miss their deadlines."""
    query = select(Goal).where(Goal.status.notin_(["completed", "archived"]))
    if user_id:
        query = query.where(Goal.user_id == user_id)

    result = await db.execute(query)
    goals = list(result.scalars().all())

    delayed = []
    for goal in goals:
        days_left = _days_between(goal.deadline)
        if days_left is None:
            continue

        # Heuristic: if progress < (100 - days_left * daily_rate_needed) by >20%, flag it
        if days_left <= 0 and goal.progress < 100:
            delayed.append({
                "goal_id": goal.id,
                "user_id": goal.user_id,
                "title": goal.title,
                "progress": goal.progress,
                "days_overdue": abs(days_left),
                "severity": "critical" if goal.progress < 50 else "high",
                "reason": "Goal is overdue",
            })
        elif days_left > 0:
            # Calculate required daily progress
            remaining = 100 - goal.progress
            daily_needed = remaining / max(days_left, 1)
            # If daily needed > 5% per day, it's at risk
            if daily_needed > 5:
                delayed.append({
                    "goal_id": goal.id,
                    "user_id": goal.user_id,
                    "title": goal.title,
                    "progress": goal.progress,
                    "days_remaining": days_left,
                    "daily_rate_needed": round(daily_needed, 2),
                    "severity": "high" if daily_needed > 10 else "medium",
                    "reason": f"Requires {daily_needed:.1f}%/day to complete on time",
                })

    delayed.sort(key=lambda x: x.get("days_overdue", 0) + (100 - x.get("progress", 0)), reverse=True)
    return delayed


async def get_team_predictions(db: AsyncSession, manager_id: int) -> dict:
    """Manager-level team predictions."""
    # Get team members
    team_result = await db.execute(
        select(User).where(User.manager_id == manager_id)
    )
    team = list(team_result.scalars().all())

    team_outlook = []
    total_burnout = 0
    total_delayed = 0

    for member in team:
        burnout = await predict_user_burnout(db, member.id)
        delayed = await predict_delayed_goals(db, member.id)

        team_outlook.append({
            "user_id": member.id,
            "name": member.name,
            "department": member.department,
            "burnout_risk": burnout["burnout_risk"],
            "burnout_level": burnout["level"],
            "delayed_goals": len(delayed),
        })

        total_burnout += burnout["burnout_risk"]
        total_delayed += len(delayed)

    avg_burnout = total_burnout / max(len(team), 1)

    return {
        "team_size": len(team),
        "avg_burnout_risk": round(avg_burnout, 1),
        "total_delayed_goals": total_delayed,
        "risk_summary": "High" if avg_burnout > 60 else ("Medium" if avg_burnout > 35 else "Low"),
        "team_members": team_outlook,
    }
