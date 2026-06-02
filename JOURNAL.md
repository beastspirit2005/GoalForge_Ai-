# Engineering & Security Journal

This journal documents the security posture, operational guidelines, and architectural considerations for the GoalForge AI platform.

---

## Security Posture Table

| Control | Implementation | Prod Status |
| :--- | :--- | :--- |
| **Auth** | JWT (HS256) + Bcrypt password hashing | ✅ Hardened |
| **RBAC** | `Depends(require_role)` + `RoleMiddleware` fallback | ✅ Dual-enforced |
| **Rate Limit** | In-memory sliding window (per-IP) | ⚠️ Needs Redis for serverless |
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

## Remaining Hardening (Tracked)

| Item | Status | Notes |
| :--- | :--- | :--- |
| httpOnly cookie JWT storage | 🔲 Planned | Requires frontend-wide refactor (localStorage → cookie) |
| Redis-backed rate limiting (`slowapi`) | 🔲 Planned | Required for serverless scaling |
| `X-Forwarded-For` aware rate limiting | 🔲 Planned | Needed behind reverse proxies |
| Password change endpoint + OTP invalidation | 🔲 Planned | Must wipe OTP state on password change |
