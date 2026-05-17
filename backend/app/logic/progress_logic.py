"""Calculate goal progress from milestones and check-ins."""


def calculate_milestone_progress(milestones: list) -> float:
    """Return 0-100 progress based on completed milestones."""
    if not milestones:
        return 0.0
    done = sum(1 for m in milestones if m.is_completed)
    return round((done / len(milestones)) * 100, 1)


def calculate_checkin_progress(checkins: list, target_value: float | None = None) -> float:
    """Return progress based on the latest check-in's actual achievement."""
    if not checkins:
        return 0.0

    latest = max(checkins, key=lambda c: c.created_at)

    if target_value and target_value > 0:
        return round(min((latest.actual_achievement / target_value) * 100, 100), 1)

    return round(latest.actual_achievement, 1)


def blend_progress(milestone_pct: float, checkin_pct: float) -> float:
    """
    Blend milestone and check-in progress (70/30 split).
    Milestone completion is the primary signal.
    """
    if milestone_pct == 0 and checkin_pct == 0:
        return 0.0
    if milestone_pct == 0:
        return checkin_pct
    if checkin_pct == 0:
        return milestone_pct
    return round(milestone_pct * 0.7 + checkin_pct * 0.3, 1)
