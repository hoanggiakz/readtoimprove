# Production Emergency Rollback Runbook

**Project:** ReadToImprove  
**Phase:** 12 — Deployment & Production Verification  
**Severity:** P1 Emergency Response  

---

## 1. Rollback Trigger Criteria

An immediate rollback MUST be triggered if any of the following occur post-deployment:
1. Application crash rate or HTTP 500 internal server errors exceed 1% of total requests for $> 3$ consecutive minutes.
2. Unhandled database connection exhaustion or catastrophic query timeouts.
3. Critical regression in the core bilingual reading experience (e.g. reader fails to render sentences or translation pops fail).
4. Content Security Policy (CSP) blocking essential script chunks or rendering the application inoperable.
5. Inadvertent credential or sensitive data leakage in public HTTP headers or pages.

---

## 2. Instant Application Rollback (< 30 Seconds)

Vercel maintains immutable build artifacts for all past deployments. An application rollback can be executed instantly without rebuilding.

### Method 1: Using Vercel CLI

```bash
# 1. List recent production deployments to identify the previous known good deployment
npx vercel deployment ls --prod

# 2. Execute instant rollback to the previous deployment URL or deployment ID
npx vercel rollback <PREVIOUS_DEPLOYMENT_URL_OR_ID> --yes
```

### Method 2: Using Vercel Dashboard

1. Navigate to **Vercel Dashboard -> Project -> Deployments**.
2. Locate the last known good deployment (prior to current release).
3. Click the **three dots menu (...)** on the deployment card.
4. Select **Instant Rollback**.
5. Confirm by clicking **Rollback**. The edge routing shifts 100% of production traffic within 15–30 seconds globally.

---

## 3. Database Rollback Procedures

### Scenario A: Rollback via Neon Instant Branching / PITR (Recommended)

Neon Serverless PostgreSQL allows point-in-time recovery without data loss:
1. In the Neon Console, navigate to **Branches**.
2. Select the `main` branch -> Click **Restore to point in time**.
3. Choose the timestamp immediately prior to migration execution (e.g. 5 minutes before deploy).
4. Point the Vercel `DATABASE_URL` and `DIRECT_URL` to the restored branch or promote the restored branch to `main`.

### Scenario B: Targeted Migration Reversal (Prisma)

If the database schema migration itself introduced breaking changes:
```bash
# 1. Identify failing migration
npx prisma migrate status

# 2. Mark the migration as rolled back in the Prisma migration table
npx prisma migrate resolve --rolled-back <FAILED_MIGRATION_NAME>
```

---

## 4. Post-Rollback Health Verification

Execute the automated smoke test suite immediately after rollback completes:

```bash
npx tsx scripts/smoke-test.ts --url=https://readtoimprove.com
```

Verify:
- [ ] Homepage returns HTTP 200 with `< 1.5s` load time.
- [ ] Reader page loads and displays bilingual text without errors.
- [ ] Database queries succeed with normal latency ($< 50\text{ms}$).
- [ ] Security headers remain intact.
- [ ] Error rates drop back to 0%.

---

## 5. Post-Incident Review (PIR)

Following successful rollback containment:
1. Preserve error logs from Vercel Functions and Neon query metrics.
2. Create a post-incident issue in GitHub summarizing root cause and affected users.
3. Formulate a patch and test on a dedicated Neon staging branch prior to redeployment.
