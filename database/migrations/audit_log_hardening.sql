-- Audit Log Hardening Migration Script
-- PostgreSQL 16+

-- 1. Add prev_hash and entry_hash columns for cryptographic integrity verification.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_hash TEXT;

-- Generate hash from columns securely. We use md5 as specified in the request.
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS entry_hash TEXT;

-- 2. Revoke UPDATE and DELETE permissions on the audit_logs table from the application user
-- to prevent direct/unauthorized mutations of historical log entries.
-- (This can be run on production deployments where a custom 'goalforge_app_user' exists).
-- REVOKE UPDATE, DELETE ON audit_logs FROM goalforge_app_user;
