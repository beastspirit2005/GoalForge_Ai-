"""Goal validation rules – max 8 goals, min 10% weightage, total = 100%."""

from fastapi import HTTPException, status


MAX_GOALS_PER_USER = 8
MIN_WEIGHTAGE = 10.0
MAX_WEIGHTAGE = 100.0
TARGET_TOTAL_WEIGHTAGE = 100.0


def validate_goal_count(current_count: int) -> None:
    if current_count >= MAX_GOALS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_GOALS_PER_USER} goals allowed per user",
        )


def validate_weightage(
    new_weightage: float,
    current_total: float,
    exclude_weightage: float = 0.0,
) -> None:
    """Check that a goal's weightage is valid in the context of the user's total."""
    if new_weightage < MIN_WEIGHTAGE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum weightage is {MIN_WEIGHTAGE}%",
        )

    if new_weightage > MAX_WEIGHTAGE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum weightage is {MAX_WEIGHTAGE}%",
        )

    projected_total = current_total - exclude_weightage + new_weightage
    if projected_total > TARGET_TOTAL_WEIGHTAGE:
        remaining = TARGET_TOTAL_WEIGHTAGE - (current_total - exclude_weightage)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Total weightage would exceed 100%. Available: {remaining:.1f}%",
        )


def validate_total_weightage(total: float) -> bool:
    """Return True when the user's goals add up to exactly 100%."""
    return abs(total - TARGET_TOTAL_WEIGHTAGE) < 0.01
