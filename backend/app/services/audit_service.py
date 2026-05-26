"""Audit log service – records all data mutations with cryptographic hash chaining."""

import json
import hashlib
from datetime import datetime
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
    """Records a data mutation and cryptographically chains it to the previous entry."""
    # 1. Fetch the entry_hash of the last audit log to form the hash chain
    stmt = select(AuditLog.entry_hash).order_by(AuditLog.id.desc()).limit(1)
    res = await db.execute(stmt)
    prev_hash = res.scalar_one_or_none()

    # 2. Instantiate new entry with prev_hash
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=json.dumps(old_value) if isinstance(old_value, dict) else old_value,
        new_value=json.dumps(new_value) if isinstance(new_value, dict) else new_value,
        prev_hash=prev_hash,
    )
    db.add(entry)
    
    # 3. Flush to generate id and created_at from database
    await db.flush()

    # 4. Compute unique hash chain signature in Python (database-agnostic)
    payload = f"{entry.id}:{entry.action}:{entry.user_id}:{entry.created_at}:{entry.prev_hash or ''}"
    entry.entry_hash = hashlib.md5(payload.encode("utf-8")).hexdigest()

    # 5. Flush once more to save the computed signature
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


async def verify_audit_chain(db: AsyncSession) -> bool:
    """Validates the cryptographic hash chain of all audit logs to guarantee data integrity."""
    stmt = select(AuditLog).order_by(AuditLog.id.asc())
    res = await db.execute(stmt)
    logs = list(res.scalars().all())

    prev_hash = None
    for log in logs:
        payload = f"{log.id}:{log.action}:{log.user_id}:{log.created_at}:{prev_hash or ''}"
        expected = hashlib.md5(payload.encode("utf-8")).hexdigest()

        if expected != log.entry_hash:
            raise ValueError(
                f"Audit chain broken at log ID {log.id}. Expected {expected}, got {log.entry_hash}"
            )
        prev_hash = log.entry_hash

    return True
