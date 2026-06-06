"""Score goal risk from progress, deadline proximity, and workload."""

from datetime import datetime, timezone


def days_until_deadline(deadline: datetime | None) -> int | None:
    """Return days remaining until deadline. None if deadline is None."""
    if not deadline:
        return None
    # Ensure deadline is timezone-aware
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return (deadline - datetime.now(timezone.utc)).days


def score_risk(progress: float, deadline: datetime | None, goal_count: int) -> str:
    """
    Return "Low", "Medium", or "High" risk.

    Heuristic:
      - High: progress < 40% and < 14 days left, OR workload > 6 goals
      - Medium: progress < 60% and < 30 days left
      - Low: everything else
    """
    days_left = days_until_deadline(deadline)

    # Workload pressure
    if goal_count > 6:
        if progress < 50:
            return "High"

    if days_left is not None:
        if days_left < 14 and progress < 40:
            return "High"
        if days_left < 30 and progress < 60:
            return "Medium"
        if days_left < 0:
            return "High" if progress < 100 else "Low"

    if progress < 30:
        return "Medium"

    return "Low"
