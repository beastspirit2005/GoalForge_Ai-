"""Work Points Service — awards gamification points with blockchain logging."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.user import User
from app.services.crypto import issue_work_token, get_wallet_balance

# Gamification point rules
POINT_RULES = {
    "goal_completed": 5,
    "goal_completed_early": 8,
    "task_on_time": 10,
    "task_early": 15,
    "task_delayed": -5,
}


async def award_points(db: AsyncSession, user_id: int, amount: float, reason: str) -> float:
    """
    Awards work points to a user in the traditional DB and
    simultaneously issues ForgeTokens on the mock blockchain.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError(f"User {user_id} not found")

    # Update DB points
    user.work_points += amount
    await db.flush()
    await db.refresh(user)

    # Issue crypto token
    issue_work_token(user_id, amount, reason)

    return user.work_points


async def award_for_action(db: AsyncSession, user_id: int, action: str) -> float | None:
    """Award points based on a predefined action type."""
    points = POINT_RULES.get(action)
    if points is None:
        return None
    return await award_points(db, user_id, points, action)


async def get_user_points(db: AsyncSession, user_id: int) -> dict:
    """Returns both the traditional DB points and the blockchain verified balance."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise ValueError(f"User {user_id} not found")

    chain_balance = get_wallet_balance(user_id)

    return {
        "db_points": user.work_points,
        "chain_balance": chain_balance,
        "is_synced": abs(user.work_points - chain_balance) < 0.01,
    }
