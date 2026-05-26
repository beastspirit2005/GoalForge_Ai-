import pytest
from sqlalchemy import select
from app.core.database import async_session, create_tables
from app.services.audit_service import log_action, verify_audit_chain
from app.models.audit_log import AuditLog


@pytest.mark.asyncio
async def test_audit_log_cryptographic_chain():
    """Verify that audit logs are chained correctly with md5 hashes and pass verification."""
    await create_tables()
    async with async_session() as db:
        from sqlalchemy import delete
        await db.execute(delete(AuditLog))
        await db.commit()
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
        assert log1.prev_hash is None
        assert log1.entry_hash is not None
        assert len(log1.entry_hash) == 32  # MD5 is 32 hex chars

        assert log2.prev_hash == log1.entry_hash
        assert log2.entry_hash is not None
        assert len(log2.entry_hash) == 32
        assert log2.entry_hash != log1.entry_hash

        # Verify the chain is valid
        is_valid = await verify_audit_chain(db)
        assert is_valid is True


@pytest.mark.asyncio
async def test_audit_log_tamper_detection():
    """Verify that tampering with a log's hash or content breaks the verification check."""
    await create_tables()
    async with async_session() as db:
        from sqlalchemy import delete
        await db.execute(delete(AuditLog))
        await db.commit()
        # Create some logs
        await log_action(db, user_id=1, action="action_1", entity_type="goal", entity_id=101)
        await log_action(db, user_id=1, action="action_2", entity_type="goal", entity_id=102)
        await db.commit()

        # Fetch the last log and modify it directly to simulate tampering
        stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(1)
        res = await db.execute(stmt)
        tampered_log = res.scalar_one()
        
        # Tamper with the action string
        tampered_log.action = "action_tampered"
        await db.flush()

        # Verification must fail and raise ValueError indicating broken chain
        with pytest.raises(ValueError) as excinfo:
            await verify_audit_chain(db)
        
        assert "Audit chain broken at log ID" in str(excinfo.value)
