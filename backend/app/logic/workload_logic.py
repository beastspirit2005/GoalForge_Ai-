"""Workload balancing utilities."""

from datetime import datetime, timezone


def workload_score(goal_count: int, avg_progress: float) -> str:
    """
    Rate a user's workload as Light / Balanced / Heavy / Overloaded.
    """
    if goal_count <= 2:
        return "Light"
    if goal_count <= 5 and avg_progress > 40:
        return "Balanced"
    if goal_count <= 7:
        return "Heavy"
    return "Overloaded"


def suggest_milestone_pacing(
    total_milestones: int,
    completed_milestones: int,
    deadline_str: str | None,
) -> str:
    """Recommend how many milestones should be completed per week."""
    if total_milestones == 0:
        return "No milestones set yet."

    remaining = total_milestones - completed_milestones
    if remaining <= 0:
        return "All milestones complete — great work!"

    if not deadline_str:
        return f"{remaining} milestones remaining. Set a deadline to get pacing advice."

    for fmt in ("%Y-%m-%d", "%d %b %Y", "%d/%m/%Y"):
        try:
            dl = datetime.strptime(deadline_str, fmt).replace(tzinfo=timezone.utc)
            weeks_left = max((dl - datetime.now(timezone.utc)).days / 7, 0.5)
            per_week = remaining / weeks_left
            return (
                f"{remaining} milestones in ~{weeks_left:.0f} weeks → "
                f"target {per_week:.1f}/week to stay on track."
            )
        except ValueError:
            continue

    return f"{remaining} milestones remaining."
