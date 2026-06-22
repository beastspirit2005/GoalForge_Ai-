from __future__ import annotations
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func, DDL, event
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "goal_created", "goal_approved"
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g. "goal", "checkin"
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    prev_hash: Mapped[str | None] = mapped_column(Text, nullable=True)
    entry_hash: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<AuditLog {self.id} {self.action} {self.entity_type}:{self.entity_id}>"


# SQLite triggers
trigger_sqlite_update = DDL("""
CREATE TRIGGER IF NOT EXISTS prevent_audit_log_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
WHEN OLD.entry_hash IS NOT NULL 
     OR NEW.id != OLD.id 
     OR NEW.action != OLD.action 
     OR NEW.user_id != OLD.user_id 
     OR NEW.entity_type != OLD.entity_type 
     OR NEW.entity_id != OLD.entity_id 
     OR NEW.created_at != OLD.created_at
BEGIN
    SELECT RAISE(ABORT, 'Audit logs cannot be updated.');
END;
""")

trigger_sqlite_delete = DDL("""
CREATE TRIGGER IF NOT EXISTS prevent_audit_log_delete
BEFORE DELETE ON audit_logs
BEGIN
    SELECT RAISE(ABORT, 'Audit logs cannot be deleted.');
END;
""")

# Postgres triggers
trigger_pg_func = DDL("""
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.entry_hash IS NULL THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Audit logs are immutable.';
END;
$$ LANGUAGE plpgsql;
""")

trigger_pg_update = DDL("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_audit_log_update') THEN
        CREATE TRIGGER prevent_audit_log_update
        BEFORE UPDATE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
    END IF;
END $$;
""")

trigger_pg_delete = DDL("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'prevent_audit_log_delete') THEN
        CREATE TRIGGER prevent_audit_log_delete
        BEFORE DELETE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
    END IF;
END $$;
""")

event.listen(AuditLog.__table__, 'after_create', trigger_sqlite_update.execute_if(dialect='sqlite'))
event.listen(AuditLog.__table__, 'after_create', trigger_sqlite_delete.execute_if(dialect='sqlite'))
event.listen(AuditLog.__table__, 'after_create', trigger_pg_func.execute_if(dialect='postgresql'))
event.listen(AuditLog.__table__, 'after_create', trigger_pg_update.execute_if(dialect='postgresql'))
event.listen(AuditLog.__table__, 'after_create', trigger_pg_delete.execute_if(dialect='postgresql'))
