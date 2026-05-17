"""Notification service."""

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    title: str,
    message: str,
    notif_type: str,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
    )
    db.add(notif)
    await db.flush()
    return notif


async def get_user_notifications(
    db: AsyncSession, user_id: int, unread_only: bool = False
) -> list[Notification]:
    query = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(50)
    )
    if unread_only:
        query = query.where(Notification.is_read == False)
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_all_read(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .values(is_read=True)
    )
    await db.flush()
