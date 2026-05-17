"""Auto-escalation rules for goals that cross risk thresholds."""


def should_escalate(risk: str, progress: float, days_left: int | None) -> bool:
    """
    Return True when a goal needs manager attention.

    Triggers:
      - High risk at any time
      - Medium risk with < 14 days remaining
      - Stalled: progress hasn't changed and deadline < 21 days
    """
    if risk == "High":
        return True

    if risk == "Medium" and days_left is not None and days_left < 14:
        return True

    if progress < 10 and days_left is not None and days_left < 21:
        return True

    return False


def escalation_message(goal_title: str, risk: str, progress: float) -> str:
    """Generate a human-readable escalation notification."""
    if risk == "High":
        return (
            f"⚠️ Goal '{goal_title}' is at HIGH risk with only {progress:.0f}% progress. "
            f"Manager intervention recommended."
        )
    return (
        f"🔔 Goal '{goal_title}' is at {risk} risk ({progress:.0f}% progress) "
        f"and approaching its deadline. Please review."
    )
