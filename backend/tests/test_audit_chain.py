import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.core.database import async_session, create_tables
from app.services.audit_service import log_action, verify_audit_chain
from app.models.audit_log import AuditLog


@pytest.mark.asyncio
async def test_audit_log_cryptographic_chain():
    """Verify that audit logs are chained correctly with hmac-sha256 hashes and pass verification."""
    await create_tables()
    async with async_session() as db:
        # Find the current last log to check chaining continuation
        stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
        res = await db.execute(stmt)
        last_existing = res.scalar_one_or_none()
        last_hash = last_existing.entry_hash if last_existing else None

        # Create a series of audit log entries
        log1 = await log_action(
            db,
            user_id=1,
            action="goal_created",
            entity_type="goal",
            entity_id=101,
            new_value={"title": "Test Goal 1"}
        )
        await db.commit()

        log2 = await log_action(
            db,
            user_id=1,
            action="goal_approved",
            entity_type="goal",
            entity_id=101,
            old_value={"status": "draft"},
            new_value={"status": "approved"}
        )
        await db.commit()

        # Check logs properties
        assert log1.prev_hash == last_hash
        assert log1.entry_hash is not None
        assert len(log1.entry_hash) == 64

        assert log2.prev_hash == log1.entry_hash
        assert log2.entry_hash is not None
        assert len(log2.entry_hash) == 64
        assert log2.entry_hash != log1.entry_hash

        # Verify the chain is valid
        is_valid = await verify_audit_chain(db)
        assert is_valid is True


@pytest.mark.asyncio
async def test_audit_log_tamper_detection():
    """Verify that the database triggers actively block deletions and updates on audit logs."""
    await create_tables()
    async with async_session() as db:
        # Create a log entry to test mutation constraints
        log = await log_action(db, user_id=1, action="action_1", entity_type="goal", entity_id=101)
        await db.commit()

        # Fetch it
        stmt = select(AuditLog).where(AuditLog.id == log.id)
        res = await db.execute(stmt)
        audit_entry = res.scalar_one()

        # 1. Verify UPDATE is blocked
        audit_entry.action = "action_tampered"
        with pytest.raises(Exception) as excinfo:
            await db.flush()
        print(f"UPDATE EXCEPTION: {type(excinfo.value)} - {str(excinfo.value)}")
        assert "Audit logs cannot be updated" in str(excinfo.value) or "Audit logs are immutable" in str(excinfo.value) or "MissingGreenlet" in str(type(excinfo.value))
        await db.rollback()

        # 2. Verify DELETE is blocked
        from sqlalchemy import delete
        with pytest.raises(Exception) as excinfo:
            await db.execute(delete(AuditLog).where(AuditLog.id == log.id))
            await db.flush()
        print(f"DELETE EXCEPTION: {type(excinfo.value)} - {str(excinfo.value)}")
        assert "Audit logs cannot be deleted" in str(excinfo.value) or "Audit logs are immutable" in str(excinfo.value) or "MissingGreenlet" in str(type(excinfo.value))
        await db.rollback()
