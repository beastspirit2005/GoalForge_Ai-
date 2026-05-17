"""Audit log service – records all data mutations."""

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_log import AuditLog


async def log_action(
    db: AsyncSession,
    *,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    old_value: dict | str | None = None,
    new_value: dict | str | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=json.dumps(old_value) if isinstance(old_value, dict) else old_value,
        new_value=json.dumps(new_value) if isinstance(new_value, dict) else new_value,
    )
    db.add(entry)
    await db.flush()
    return entry


async def get_audit_logs(
    db: AsyncSession,
    limit: int = 100,
    entity_type: str | None = None,
) -> list[AuditLog]:
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    result = await db.execute(query)
    return list(result.scalars().all())
