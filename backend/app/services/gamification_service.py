"""Gamification Service — leaderboard and points transaction management."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.work_points_transaction import PointTransaction


async def record_point_transaction(
    db: AsyncSession,
    user_id: int,
    points_delta: int,
    reason: str,
    entity_type: str | None = None,
    entity_id: int | None = None,
) -> PointTransaction:
    """Record a gamification point transaction."""
    txn = PointTransaction(
        user_id=user_id,
        points_delta=points_delta,
        reason=reason,
        related_entity_type=entity_type,
        related_entity_id=entity_id,
    )
    db.add(txn)
    await db.flush()
    await db.refresh(txn)
    return txn


async def get_user_transactions(
    db: AsyncSession,
    user_id: int,
    limit: int = 50,
) -> list[dict]:
    """Get recent point transactions for a user."""
    result = await db.execute(
        select(PointTransaction)
        .where(PointTransaction.user_id == user_id)
        .order_by(PointTransaction.created_at.desc())
        .limit(limit)
    )
    transactions = result.scalars().all()
    return [
        {
            "id": t.id,
            "points_delta": t.points_delta,
            "reason": t.reason,
            "related_entity_type": t.related_entity_type,
            "related_entity_id": t.related_entity_id,
            "created_at": str(t.created_at) if t.created_at else None,
        }
        for t in transactions
    ]


async def get_global_leaderboard(
    db: AsyncSession,
    limit: int = 20,
) -> list[dict]:
    """Get global leaderboard ranked by work points."""
    result = await db.execute(
        select(User)
        .where(User.is_active == True, User.role.in_(["employee", "team_lead"]))
        .order_by(User.work_points.desc())
        .limit(limit)
    )
    users = list(result.scalars().all())

    return [
        {
            "rank": idx + 1,
            "user_id": u.id,
            "name": u.name,
            "department": u.department,
            "work_points": u.work_points,
            "is_top_performer": idx == 0,
        }
        for idx, u in enumerate(users)
    ]


async def get_team_leaderboard(
    db: AsyncSession,
    manager_id: int,
    limit: int = 20,
) -> list[dict]:
    """Get team leaderboard for a manager."""
    result = await db.execute(
        select(User)
        .where(User.manager_id == manager_id, User.is_active == True)
        .order_by(User.work_points.desc())
        .limit(limit)
    )
    users = list(result.scalars().all())

    return [
        {
            "rank": idx + 1,
            "user_id": u.id,
            "name": u.name,
            "department": u.department,
            "work_points": u.work_points,
            "is_top_performer": idx == 0,
        }
        for idx, u in enumerate(users)
    ]
