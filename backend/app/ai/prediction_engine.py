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
    if days_left is not None and days_left > 0:
        # Expected progress = (time elapsed / total time) * 100
        # We approximate: if progress >= expected, high probability
        expected = 100 - (days_left / max(days_left + 30, 1) * 100)  # rough estimate
        rate_score = min(100, (progress / max(expected, 1)) * 100)
    elif days_left is not None and days_left <= 0:
        # Overdue
        rate_score = max(0, progress * 0.8)  # Penalize overdue
    else:
        rate_score = progress  # No deadline info

    # ── Factor 2: Milestone trajectory (20%) ──
    milestone_score = milestone_completion_rate

    # ── Factor 3: Workload pressure (15%) ──
    if goal_count <= 3:
        workload_score = 100  # Light load
    elif goal_count <= 5:
        workload_score = 80
    elif goal_count <= 7:
        workload_score = 55
    else:
        workload_score = 30  # Overloaded

    # ── Factor 4: Update recency (15%) ──
    if days_since_last_update <= 2:
        recency_score = 100
    elif days_since_last_update <= 7:
        recency_score = 75
    elif days_since_last_update <= 14:
        recency_score = 45
    else:
        recency_score = 15  # Stale goal

    # ── Factor 5: Weightage attention (10%) ──
    weightage_score = min(100, weightage * 4)  # Higher weight = more likely focused

    # ── Composite probability ──
    probability = (
        rate_score * 0.40
        + milestone_score * 0.20
        + workload_score * 0.15
        + recency_score * 0.15
        + weightage_score * 0.10
    )
    probability = max(0, min(100, round(probability, 1)))

    # Risk level
    if probability >= 75:
        risk = "Low"
    elif probability >= 50:
        risk = "Medium"
    else:
        risk = "High"

    # Factors breakdown
    factors = [
        {"name": "Progress Rate", "score": round(rate_score, 1), "weight": "40%"},
        {"name": "Milestone Trajectory", "score": round(milestone_score, 1), "weight": "20%"},
        {"name": "Workload Balance", "score": round(workload_score, 1), "weight": "15%"},
        {"name": "Update Recency", "score": round(recency_score, 1), "weight": "15%"},
        {"name": "Goal Priority", "score": round(weightage_score, 1), "weight": "10%"},
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
    Predict burnout risk for an employee.

    Factors:
    1. Goal overload (30%): > 6 goals is high pressure
    2. Progress pressure (25%): low progress across many goals = stress
    3. Weightage burden (15%): total > 100% or heavily skewed
    4. Check-in exhaustion (15%): very frequent updates = potential burnout
    5. Risk accumulation (15%): multiple high-risk goals compound stress
    """
    # ── Factor 1: Goal overload (30%) ──
    if goal_count <= 3:
        overload = 10
    elif goal_count <= 5:
        overload = 30
    elif goal_count <= 7:
        overload = 60
    else:
        overload = 90

    # ── Factor 2: Progress pressure (25%) ──
    if avg_progress >= 70:
        pressure = 15  # On track, low stress
    elif avg_progress >= 50:
        pressure = 40
    elif avg_progress >= 30:
        pressure = 65
    else:
        pressure = 90  # Falling behind badly

    # ── Factor 3: Weightage burden (15%) ──
    burden = min(100, max(0, (total_weightage - 80) * 2))

    # ── Factor 4: Check-in exhaustion (15%) ──
    if checkin_frequency <= 2:
        exhaustion = 10
    elif checkin_frequency <= 5:
        exhaustion = 30
    elif checkin_frequency <= 10:
        exhaustion = 60
    else:
        exhaustion = 85

    # ── Factor 5: Risk accumulation (15%) ──
    risk_accum = min(100, high_risk_goals * 30)

    # ── Composite ──
    burnout_score = (
        overload * 0.30
        + pressure * 0.25
        + burden * 0.15
        + exhaustion * 0.15
        + risk_accum * 0.15
    )
    burnout_score = max(0, min(100, round(burnout_score, 1)))

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
            "goal_overload": round(overload, 1),
            "progress_pressure": round(pressure, 1),
            "weightage_burden": round(burden, 1),
            "update_exhaustion": round(exhaustion, 1),
            "risk_accumulation": round(risk_accum, 1),
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
