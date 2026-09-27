# Secrets Management & Key Rotation Runbook: ReadToImprove

**Date:** 2026-09-27  
**Scope:** Application Secrets, Session Keys, Database Credentials, and Administrator Passwords  
**Standard:** NIST SP 800-57 (Recommendation for Key Management)  

---

## 1. Inventory of Critical Secrets

| Secret Identifier | Environment Variable | Usage Scope | Key Strength / Format | Current Location | Rotation Cycle |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Session JWT Secret** | `AUTH_SECRET` | Signing and verifying user session JWT tokens (`jose`) | 256-bit+ cryptographic random string (min 32 chars) | Environment variable (`.env`, Vercel Secrets) | 90 days / on compromise |
| **PostgreSQL Connection** | `DATABASE_URL` | Prisma ORM database connection string | `postgresql://user:pass@host:port/db?schema=public` | Environment variable (GitHub Secrets, Vercel Secrets) | 180 days / on DB maintenance |
| **Admin Initial Password** | `ADMIN_INITIAL_PASSWORD` | Seeds initial administrator account on database init | $\ge 16$ characters with uppercase, lowercase, numbers, symbols | Environment variable (`.env`) | Rotated immediately on first login |
| **Upstash Redis Token** | `UPSTASH_REDIS_REST_TOKEN` | Authenticates distributed rate limiter API requests | Base64 token | Environment variable | 180 days |

---

## 2. Standard Secret Rotation Procedures

### 2.1 Rotating `AUTH_SECRET` (Zero-Downtime Procedure)

Rotating `AUTH_SECRET` invalidates existing JWT session cookies unless handled gracefully. For scheduled zero-downtime rotation:

1. **Generate New Cryptographic Key:**
   ```bash
   openssl rand -base64 48
   ```
2. **Staged Deployment (Dual-Key Verification):**
   - The application supports verifying tokens against a comma-separated list of keys (`AUTH_SECRET_PRIMARY,AUTH_SECRET_PREVIOUS`).
   - Set `AUTH_SECRET` to the new secret, while retaining the old secret in `AUTH_SECRET_PREVIOUS`.
   - New logins receive tokens signed by the primary secret. Existing active users remain authenticated via the fallback previous secret.
3. **Grace Period (7 Days):**
   - Session duration is 7 days. After 7 days, all active user tokens will have migrated to the primary key upon renewal or re-authentication.
4. **Decommission Previous Key:**
   - Remove `AUTH_SECRET_PREVIOUS` from hosting environment settings.

---

### 2.2 Rotating `DATABASE_URL`

1. **Provision New Database Credentials:**
   - In PostgreSQL / cloud provider (Neon / Supabase / RDS), create a secondary user with identical table permissions:
     ```sql
     CREATE USER app_user_v2 WITH PASSWORD 'NewSecurePass2026!';
     GRANT ALL PRIVILEGES ON DATABASE readtoimprove TO app_user_v2;
     GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user_v2;
     ```
2. **Update Hosting Environment Configuration:**
   - Update `DATABASE_URL` in Vercel / GitHub Actions Secrets to point to `app_user_v2`.
3. **Trigger Zero-Downtime Deployment:**
   - Trigger deployment. Next.js serverless instances drain active connections to the old user and establish connections using `app_user_v2`.
4. **Revoke Old Database Credentials:**
   - After confirming successful health checks on the new deployment:
     ```sql
     REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_user_v1;
     DROP USER app_user_v1;
     ```

---

### 2.3 Rotating Administrator Password

1. **Authentication:**
   - Log into `/login` with current administrative credentials.
2. **Admin Console Access:**
   - Navigate to `/secure-console-x7/users`.
3. **Password Update:**
   - Execute password change action. The new password is automatically hashed with `bcryptjs` ($cost = 12$) before writing to PostgreSQL.
4. **Session Termination:**
   - Trigger `logoutAction` across any open sessions to force re-authentication with the new password.

---

## 3. Emergency Secret Revocation (Compromise Response)

In the event of an uncommitted secret leak, unauthorized repository commit, or server intrusion:

1. **Immediate Revocation (< 15 Minutes):**
   - **Step 1:** Generate new `AUTH_SECRET`:
     ```bash
     openssl rand -base64 64
     ```
   - **Step 2:** Immediately replace `AUTH_SECRET` in production environment settings and redeploy instantly. This terminates all active sessions globally, neutralizing any stolen cookies.
   - **Step 3:** Rotate PostgreSQL database password immediately in cloud provider console and redeploy with new `DATABASE_URL`.
2. **Audit Log Inspection (< 1 Hour):**
   - Query `AuditLog` table for all operations during the potential compromise window:
     ```sql
     SELECT * FROM "AuditLog" 
     WHERE "createdAt" >= NOW() - INTERVAL '24 HOURS' 
     ORDER BY "createdAt" DESC;
     ```
   - Inspect all `UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT` and administrative mutations (`ARTICLE_PUBLISH`, `USER_ROLE_CHANGE`).
3. **Post-Incident Review:**
   - Check Git history to ensure no plaintext keys were committed. If committed, use `git filter-repo` or BFG Repo-Cleaner and force-push sanitized branches.
