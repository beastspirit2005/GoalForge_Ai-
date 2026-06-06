# Engineering & Security Journal

This journal documents the security posture, operational guidelines, and architectural considerations for the GoalForge AI platform.

---

## Security Posture Table

| Control | Implementation | Prod Status |
| :--- | :--- | :--- |
| **Auth** | Secure `httpOnly` cookie-based JWT storage + Bcrypt | ✅ Hardened |
| **RBAC** | `Depends(require_role)` + `RoleMiddleware` fallback | ✅ Dual-enforced |
| **Rate Limit** | Redis Sorted Set sliding-window (with local in-memory fallback) | ✅ Hardened |
| **CORS** | Explicit domain list via `CORS_ORIGINS` env | ✅ Secure |
| **DB Integrity** | Alembic + idempotent `setval` startup migration | ✅ Safe |
| **OTP Security** | `secrets` CSPRNG + wipe-on-mismatch + progressive lockout | ✅ Hardened |

---

## Serverless Limitations

> [!NOTE]
> In-memory rate limiters and startup `setval` calls do not scale in Vercel/Cloud functions. Production deployments must use Redis-backed `slowapi` and Alembic migrations. Dev/localhost falls back to in-memory + startup sync for rapid iteration.

---

## OTP Security Notes

The OTP subsystem enforces the following hardened security practices:

1. **Cryptographically Secure Random Generation:**
   * Uses Python's `secrets.randbelow()` (OS-level CSPRNG) for OTP generation — never the insecure pseudo-random `random` module.

2. **Wipe on Mismatch:**
   * On any failed verification attempt, the stored OTP code is immediately wiped from the database. The attacker must trigger a brand-new OTP request for every guess, making brute-force infeasible.

3. **Progressive Lockout (3 tries per window):**

   | Lockout # | Duration | Unlock method |
   | :--- | :--- | :--- |
   | 1st | 5 minutes | Auto-unlock |
   | 2nd | 10 minutes | Auto-unlock |
   | 3rd | 15 minutes | Auto-unlock |
   | 4th+ | Permanent | Admin must re-enable via Admin Console |

   * Lockout checks are **O(1)** — a single timestamp comparison against `otp_locked_until`.
   * The escalation tier (`otp_lockout_count`) is preserved across OTP re-requests so attackers cannot reset the escalation by requesting new codes.
   * On successful verification, all lockout state is fully reset.

4. **Expiration Enforcement:**
   * Strict `otp_expires_at < now()` check with immediate wipe on expiry.

5. **Future: Session Lifetime Coherence:**
   * Once a password-change endpoint is added, it must clear `otp_code`, `otp_expires_at`, and reset `otp_failed_attempts` before committing.

---

## Security Hardening Controls

All planned hardening items have been implemented and verified:
- **httpOnly cookie JWT storage**: Token cookies are configured with httpOnly, Secure, SameSite=Strict.
- **Redis-backed rate limiting**: Implemented Redis Sorted Set sliding-window with auto-fallback to in-memory registries.
- **`X-Forwarded-For` aware rate limiting**: Parses proxy headers to correctly identify client IPs behind load balancers/reverse proxies.
- **Password change endpoint + OTP invalidation**: POST `/auth/change-password` endpoint verifies current password, hashes new password, and invalidates all active OTP state and progressive lockouts.
- **Administrative IDOR Prevention**: Replaced `UserUpdate` with `AdminUserUpdate` schema for `/admin/users/{user_id}` route to whitelist and restrict editable fields for administration profiles.
- **Goal, Milestone & Check-in Access Control**: Added strict ownership verification to block users from creating, modifying, or querying milestones and check-ins belonging to other users' goals unless they are an authorized manager or administrator.
- **AI Performance Narrative Authorization**: Restricted the AI performance narrative generator (`/ai/performance-narrative`) to ensure users can only generate reports for themselves, L1 managers for their direct reportees, and administrators for any user.

---

## Recent Updates & Upgrades (June 2026)

The platform backend has undergone a series of critical security, architectural, and compatibility upgrades:

1. **Pydantic v2 Migration:**
   * Upgraded all schemas (e.g. `auth_schema.py`, `goal_schema.py`, `analytics_schema.py`, `checkin_schema.py`) and config settings to Pydantic v2.
   * Replaced deprecated `class Config` inner classes with Pydantic v2 `model_config = ConfigDict(...)`.
   * Standardized settings validation using the new `SettingsConfigDict` and updated validators to utilize modern `@model_validator(mode="after")`.

2. **Security & Production Hardening Guardrails:**
   * **Strict Validation:** Configured the application configuration (`config.py`) to raise a validation block at startup when in production mode (`DEBUG=False`) if `SECRET_KEY` is blank or defaults, or if `CORS_ORIGINS` is missing or configured with a wildcard (`*`).
   * **Protected Endpoints:** Reinforced route-level authorization so utility routes like `/seed` and `/metrics` are inaccessible in production/external environments.
   * **Test Environment Resilience:** Configured `backend/tests/conftest.py` and `.github/workflows/ci.yml` to automatically inject test configurations (`DEBUG=True`, safe dummy `SECRET_KEY`, and explicit localhost `CORS_ORIGINS`) to prevent test suites from triggering production safety checks.

3. **Backend Logic & Stability Improvements:**
   * **Service Cleanup:** Removed duplicate declaration of `get_team_goals` inside `goal_service.py` to prevent route handler binding conflicts.
   * **Timestamp Parsing Fix:** Resolved a route-level parsing bug in `goal_routes.py` where date queries crashed SQLite by enforcing explicit string-to-datetime parsing before query execution.
   * **Logger Modernization:** Updated `utils/logger.py` to migrate from the deprecated `pythonjsonlogger.json.JsonFormatter` module path to the modern `pythonjsonlogger.jsonlogger.JsonFormatter` import, eliminating runtime startup warnings.

4. **Integration Test Suite Extension:**
   * Integrated comprehensive security-hardening unit tests under `backend/tests/test_security_hardening.py` to assert that CORS wildcards are blocked under production, default keys fail validations, and `/seed`/`/metrics` blocks unauthorized origins.

5. **IDOR & Broken Access Control Hardening:**
   * **Administrative IDOR Fix**: Replaced `UserUpdate` with `AdminUserUpdate` schema inside `admin_routes.py` (`edit_user`) to explicitly whitelist fields that admins can modify, reducing the attack surface.
   * **Milestone & Check-in Guards**: Added ownership checks in `milestone_service.py` and `checkin_routes.py` to prevent unauthorized resource viewing or manipulation.
   * **AI Performance Narrative Safeguards**: Added role and reportee verification in `ai_routes.py` (`/ai/performance-narrative`) ensuring users can only run narratives on their own records, managers on their direct reportees, and admins system-wide.
   * **Vercel Deployability Assurance**: Retained standard proxy and config settings to preserve "plug-and-play" compatibility for Vercel and serverless architectures.


