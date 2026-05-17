"""Score goal risk from progress, deadline proximity, and workload."""

from datetime import datetime, timezone


def days_until_deadline(deadline_str: str | None) -> int | None:
    """Parse a date string and return days remaining. None if unparseable."""
    if not deadline_str:
        return None
    for fmt in ("%Y-%m-%d", "%d %b %Y", "%d/%m/%Y"):
        try:
            dl = datetime.strptime(deadline_str, fmt).replace(tzinfo=timezone.utc)
            return (dl - datetime.now(timezone.utc)).days
        except ValueError:
            continue
    return None


def score_risk(progress: float, deadline_str: str | None, goal_count: int) -> str:
    """
    Return "Low", "Medium", or "High" risk.

    Heuristic:
      - High: progress < 40% and < 14 days left, OR workload > 6 goals
      - Medium: progress < 60% and < 30 days left
      - Low: everything else
    """
    days_left = days_until_deadline(deadline_str)

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
