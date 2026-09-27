# PHASE 12 — IMPLEMENTATION PLAN: VERCEL DEPLOYMENT & PRODUCTION VERIFICATION

**Project:** ReadToImprove  
**Phase:** 12 — Deployment & Production Verification  
**Document Version:** v1.0  
**Date:** 2026-09-27  
**Status:** PLAN PROPOSED — AWAITING USER APPROVAL & CREDENTIALS  
**Branch:** `feat/phase-12` (to be created from `master`/`main`)  
**Git Tag Start:** `phase-12-start`  
**Git Tag Complete:** `phase-12-complete`  
**Timebox:** 3 days  

---

## 1. Objective

Phase 12 deploys the ReadToImprove bilingual reading platform to production infrastructure using Vercel, Neon Serverless PostgreSQL, and Upstash Redis. The deployment follows a strict staged rollout across three sub-phases: Infrastructure Provisioning (12A), Preview Deployment & Regression Verification (12B), and Production Promotion (12C). The primary goal is delivering sub-second page loads, 100% data integrity, active HTTP security headers, and automated rollback capability while maintaining the 103 kB First Load JS bundle budget.

---

## 2. Prerequisites Verification Result

### 2.1 Local Codebase Health Commands (Raw Output)

#### `git status`
```text
On branch feat/phase-11b
nothing to commit, working tree clean
```

#### `git log --oneline -5`
```text
4b7f34f feat(security): complete Phase 11B security audit, hardening, and penetration testing
665b37d ci: configure DATABASE_URL secret and Next.js build in workflow
baa5be8 Merge pull request #1 from hoanggiakz/feat/phase-11a
11dbb30 docs(phase-11a): revise walkthrough v1.1 with mandatory sections
780bec1 docs(phase-11a): revise walkthrough v1.1 with mandatory sections
```

#### `git tag --list "phase-*"`
```text
phase-08-complete
phase-08-start
phase-09-complete
phase-09-start
phase-10-complete
phase-10-start
phase-10.5-complete
phase-10.5-start
phase-11a-complete
phase-11a-start
phase-11b-complete
phase-11b-start
```

#### `npm run test` (Vitest Unit & Security Suite)
```text
> readtoimprove@0.1.0 test
> vitest run

 RUN  v5.0.1 D:/readtoimprove

 ✓ src/lib/queries/__tests__/user-stats.test.ts (13 tests) 71ms
 ✓ src/__tests__/security/input-sanitization.test.tsx (8 tests) 79ms
 ✓ src/components/search/__tests__/search-highlight.test.tsx (6 tests) 151ms
 ✓ src/components/ui/__tests__/badge.test.tsx (6 tests) 264ms
 ✓ src/components/public/__tests__/article-card-skeleton.test.tsx (4 tests) 77ms
 ✓ src/components/__tests__/cefr-badge.test.tsx (6 tests) 281ms
 ✓ src/__tests__/smoke.test.tsx (5 tests) 466ms
 ✓ src/components/public/__tests__/empty-state.test.tsx (5 tests) 761ms
 ✓ src/components/public/__tests__/pagination.test.tsx (7 tests) 849ms
 ✓ src/components/ui/__tests__/button.test.tsx (8 tests) 1082ms
 ✓ src/__tests__/security/crypto-and-pii.test.ts (8 tests) 1482ms
 ✓ src/lib/__tests__/search.test.ts (12 tests) 19ms
 ✓ src/lib/actions/__tests__/reading-history.test.ts (12 tests) 23ms
 ✓ src/lib/__tests__/rate-limit.test.ts (5 tests) 12ms
 ✓ src/validations/__tests__/admin.test.ts (8 tests) 16ms
 ✓ src/validations/__tests__/public.test.ts (5 tests) 18ms
 ✓ src/lib/actions/__tests__/vocabulary.test.ts (6 tests) 14ms
 ✓ src/lib/__tests__/sentence-slicer.test.ts (10 tests) 15ms
 ✓ src/__tests__/security/auth-guards.test.ts (8 tests) 20ms
 ✓ src/validations/__tests__/auth.test.ts (8 tests) 19ms
 ✓ src/__tests__/security/idor-isolation.test.ts (6 tests) 21ms
 ✓ src/validations/__tests__/user-history.test.ts (6 tests) 17ms
 ✓ src/lib/__tests__/audit-log.test.ts (4 tests) 16ms
 ✓ src/validations/__tests__/word-bank.test.ts (4 tests) 14ms
 ✓ src/lib/__tests__/url-utils.test.ts (4 tests) 8ms
 ✓ src/validations/__tests__/search.test.ts (6 tests) 13ms
 ✓ src/lib/__tests__/offsets.test.ts (6 tests) 13ms
 ✓ src/lib/actions/__tests__/favorites.test.ts (6 tests) 12ms
 ✓ src/lib/__tests__/cefr.test.ts (6 tests) 7ms
 ✓ src/__tests__/security/rate-limit.test.ts (6 tests) 13ms

 Test Files  30 passed (30)
      Tests  204 passed (204)
   Start at  14:12:42
   Duration  12.33s (environment 71%, setup 17%, tests 5%, import 3%, transform 2%, worker 1%)

=== EXIT CODE: 0 ===
```

#### `npx tsx scripts/verify-db.ts`
```text
================================================================================
ReadToImprove Phase 2 — Automated Database & Integrity Verification Suite
================================================================================

[✓ PASS] TC-DB-01: Database Connectivity — Successfully connected to PostgreSQL on port 5433.
[✓ PASS] TC-DB-02: Seeded Record Counts Verification — Users: 2, Articles: 3, Categories: 5, Vocab: 18, Sentences: 9, Mappings: 18.
[✓ PASS] TC-DB-03: Deep Relational Traversal — Successfully traversed Article "How Next-Generation Clean Ener..." through Sentences to Vocabulary.
[✓ PASS] TC-DB-04: Offset Mathematical Bounds — All 18 vocabulary highlight offsets satisfy mathematical bounds.
[✓ PASS] TC-DB-05: Offset Slicing Identity — All 18 vocabulary highlights identically match raw sentence slices.
[✓ PASS] TC-DB-06: Non-Overlapping Highlight Integrity — Zero overlapping highlight ranges detected across all seeded sentences.
[✓ PASS] TC-DB-07: Sentence Order Uniqueness — Prisma rejected duplicate orderIndex with P2002 Unique Constraint violation.
[✓ PASS] TC-DB-08: Transaction Atomicity & Rollback Verification — Transaction aborted cleanly on exception; 0 partial or orphaned records remained.
[✓ PASS] TC-DB-09: Global Vocabulary Preservation on Article Cascade Delete — Preserved global Vocabulary record.
[✓ PASS] TC-DB-10: User Saved Vocabulary & Reading History Relational Integrity — Verified learner profile records.

================================================================================
SUMMARY: Total Tests: 10 | Passed: 10 | Failed: 0
================================================================================
=== EXIT CODE: 0 ===
```

#### `npm run build`
```text
> readtoimprove@0.1.0 build
> next build

   ▲ Next.js 15.5.25
   - Environments: .env.local, .env

   Creating an optimized production build ...
 ✓ Compiled successfully in 3.4s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/24) ...
   Generating static pages (6/24) 
   Generating static pages (12/24) 
   Generating static pages (18/24) 
 ✓ Generating static pages (24/24)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                        Size  First Load JS  Revalidate  Expire
┌ ƒ /                                             136 B         125 kB
├ ○ /_not-found                                   161 B         103 kB
├ ƒ /api/me/favorites                             161 B         103 kB
├ ƒ /api/me/reading-history                       161 B         103 kB
├ ƒ /api/me/stats                                 161 B         103 kB
├ ƒ /api/og                                       161 B         103 kB
├ ƒ /api/search                                   161 B         103 kB
├ ƒ /api/search/suggestions                       161 B         103 kB
├ ƒ /articles                                     137 B         125 kB
├ ƒ /articles/[slug]                            9.76 kB         131 kB
├ ƒ /categories                                   185 B         107 kB
├ ƒ /categories/[slug]                            186 B         113 kB
├ ○ /login                                      3.16 kB         119 kB
├ ƒ /me                                           185 B         107 kB
├ ƒ /me/favorites                               1.92 kB         114 kB
├ ƒ /me/progress                                3.78 kB         120 kB
├ ƒ /me/reading-history                         5.84 kB         127 kB
├ ○ /register                                   3.38 kB         120 kB
├ ○ /robots.txt                                   161 B         103 kB
├ ƒ /secure-console-x7                            185 B         107 kB
├ ƒ /secure-console-x7/articles                 4.99 kB         138 kB
├ ƒ /secure-console-x7/articles/[id]/edit         135 B         137 kB
├ ƒ /secure-console-x7/articles/[id]/sentences  6.01 kB         137 kB
├ ƒ /secure-console-x7/articles/new               135 B         137 kB
├ ƒ /secure-console-x7/audit-logs               1.47 kB         104 kB
├ ƒ /secure-console-x7/categories               5.63 kB         117 kB
├ ƒ /secure-console-x7/users                    4.44 kB         132 kB
├ ƒ /secure-console-x7/vocabulary               3.78 kB         135 kB
├ ○ /sitemap.xml                                  161 B         103 kB          1h      1y
└ ƒ /word-bank                                  5.91 kB         138 kB
+ First Load JS shared by all                    103 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

=== EXIT CODE: 0 ===
```

---

### 2.2 Prerequisites Checklist Status (Verification Gate)

| Category | Requirement Item | Verification Status | Action Required |
|---|---|:---:|---|
| **Local Quality Gate** | Clean working tree (`git status`) | **PASS** | Ready |
| **Local Quality Gate** | 168+ Vitest Unit tests (204 tests) | **PASS** | Ready |
| **Local Quality Gate** | DB Verification Suite (10 tests) | **PASS** | Ready |
| **Local Quality Gate** | Next.js Build (103 kB First Load JS) | **PASS** | Ready |
| **Infra Account** | Vercel Account linked to GitHub | **MISSING** | User confirmation required |
| **Infra Account** | Neon PostgreSQL Account (Singapore) | **MISSING** | User confirmation required |
| **Infra Account** | Upstash Redis Production Instance | **MISSING** | User confirmation required |
| **Infra Account** | Object Storage (Vercel Blob / R2) | **MISSING** | User confirmation required |
| **Credential** | `VERCEL_TOKEN` | **MISSING** | User confirmation required |
| **Credential** | `DATABASE_URL` (Neon pooled endpoint) | **MISSING** | User confirmation required |
| **Credential** | `DIRECT_URL` (Neon unpooled migration) | **MISSING** | User confirmation required |
| **Credential** | `AUTH_SECRET` (Production 256-bit) | **MISSING** | User confirmation required |
| **Credential** | `ADMIN_EMAIL` | **MISSING** | User confirmation required |
| **Credential** | `ADMIN_INITIAL_PASSWORD` | **MISSING** | User confirmation required |
| **Credential** | `ADMIN_BASE_PATH` (e.g. `/secure-console-x7`) | **MISSING** | User confirmation required |
| **Credential** | `UPSTASH_REDIS_REST_URL` & `TOKEN` | **MISSING** | User confirmation required |
| **Credential** | `CRON_SECRET` | **MISSING** | User confirmation required |
| **Credential** | `BLOB_READ_WRITE_TOKEN` (if Vercel Blob) | **MISSING** | User confirmation required |
| **Credential** | `NEXT_PUBLIC_APP_URL` | **MISSING** | User confirmation required |
| **Git & Domain** | GitHub repo pushed to remote | **PENDING** | Merge & push to `main` required |
| **Git & Domain** | Production Domain | **PENDING** | Custom domain or `*.vercel.app` |

> [!WARNING]
> **GATE TRIGGER: MISSING CREDENTIALS & ACCOUNTS**  
> Execution cannot proceed until the user confirms the availability of the infrastructure accounts and environment credentials listed above. DO NOT paste secret values into chat; only confirm they exist and are ready to be configured.

---

## 3. Architecture Decisions (ADR-023 Candidate)

### 3.1 Hosting Platform: Vercel
- **Tier**: Vercel Hobby tier is sufficient for initial launch and validation (< 100k requests/month, 100 GB bandwidth). Seamless upgrade path to Vercel Pro ($20/mo) when traffic exceeds Hobby quotas or when team collaboration is required.
- **Runtime**: Node.js 20 LTS Serverless Functions (Singapore region `sin1`).

### 3.2 Database: Neon Serverless PostgreSQL
- **Justification**:
  1. Built-in connection pooling via PgBouncer (critical for Next.js serverless architecture where each request spawns a function container).
  2. Database branching: Allows creating instant, copy-on-write database branches for Vercel Preview deployments, providing 100% staging isolation without risking production data.
  3. Regional proximity: Neon Singapore (`ap-southeast-1`) matches Vercel `sin1`, keeping query round-trip latency under 5ms.
  4. Auto-suspend / scale-to-zero during idle periods, minimizing compute costs while sustaining high burst capacity.

### 3.3 Connection Pooling: Dual-URL Architecture (`schema.prisma`)
- `DATABASE_URL`: Points to Neon pooled connection string (`-pooler.ap-southeast-1.aws.neon.tech:5432` or `:6543`) with `pgbouncer=true`. Used by `@prisma/client` runtime for fast serverless queries.
- `DIRECT_URL`: Points to Neon direct connection string (`.ap-southeast-1.aws.neon.tech:5432`). Configured via `directUrl = env("DIRECT_URL")` in `prisma/schema.prisma` for executing schema migrations (`prisma migrate deploy`), which require advisory locks unsupported by connection poolers.

### 3.4 Object Storage: Vercel Blob vs Cloudflare R2
- **Recommendation**: Vercel Blob (`@vercel/blob`) for MVP. Provides zero-configuration integration, automatic token propagation on Vercel, global edge CDN distribution, and simple SDK. Cloudflare R2 is the planned migration target if audio upload volume exceeds 10 GB/month to capitalize on zero egress fees.

### 3.5 Environment Strategy: Vercel Environments
- **Production (`main` branch)**: Points to production Neon DB branch, production Upstash Redis, production `AUTH_SECRET`, and production `NEXT_PUBLIC_APP_URL`.
- **Preview (PRs and `feat/*` branches)**: Points to dedicated Preview Neon DB branch (or staging DB), preview Upstash key prefix, and dynamic `*.vercel.app` preview URL.
- **Development (Localhost)**: Uses local Docker PostgreSQL (port 5433) and local mock redis fallback.

### 3.6 Region Selection: Singapore (`sin1`)
- Lowest latency (< 35ms) to the target audience in Vietnam. Both Vercel Serverless Functions and Neon database will be provisioned in the Singapore region to eliminate cross-continent database round-trips.

### 3.7 Custom Domain Strategy
- Primary: User's custom domain (e.g., `readtoimprove.com` / `www.readtoimprove.com`) with automated SSL via Let's Encrypt / Vercel Edge DNS.
- Fallback & Preview: `readtoimprove.vercel.app` and branch preview URLs.

### 3.8 Rollback Strategy
- **Application Rollback**: Instant rollback via Vercel CLI (`vercel rollback`) or Vercel Dashboard in under 30 seconds.
- **Database Rollback**: Point-in-time recovery (PITR) via Neon timeline rollback, or targeted `prisma migrate resolve --rolled-back <migration>`.

### 3.9 Secrets Management & Separation
- Local secrets in `.env.local` strictly isolated from production. All production secrets configured via Vercel Dashboard / Vercel CLI encrypted environment store. Zero secrets committed to git.

---

## 4. Database Changes & Migration Plan

- **Schema Evolution**: No new tables or fields required. Schema remains at `20260922000000_add_user_history_and_goals`.
- **Prisma Datasource Hardening**:
  Update `prisma/schema.prisma` to support direct migration URL:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }
  ```
- **Existing Migrations to Apply in Production**:
  1. `20260911131715_init_schema`
  2. `20260913130000_add_trigram_search`
  3. `20260914140000_add_article_full_text_search`
  4. `20260922000000_add_user_history_and_goals`
- **Execution Command**:
  ```bash
  npx prisma migrate deploy
  ```
  *(Strictly `prisma migrate deploy`, NEVER `prisma migrate dev` or `prisma db push` in production).*
- **Backup Pre-migration**: Create a Neon branch snapshot `backup-pre-phase-12` before triggering `migrate deploy`.

---

## 5. API & Server Changes

- **Metadata & Canonical URL Dynamic Binding**:
  - `NEXT_PUBLIC_APP_URL` updated from `http://localhost:3000` to `https://readtoimprove.com` (or preview URL).
  - OpenGraph image generation (`/api/og`) dynamically constructs canonical asset URLs.
  - Sitemaps (`/sitemap.xml`) render production canonical URLs.
- **Vercel Cron Configuration (`vercel.json`)**:
  Configure cron job for automated scheduled publishing:
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/publish-scheduled",
        "schedule": "0 * * * *"
      }
    ]
  }
  ```
- **Cron Authorization**: Endpoints validate `Authorization: Bearer ${CRON_SECRET}` matching Vercel Cron headers.

---

## 6. UI & Error Handling Verification

- Zero UI layout or visual changes.
- **Production Error Masking**: Verify that Next.js production error boundaries (`src/app/error.tsx`, `src/app/not-found.tsx`, and API 500 handlers) return sanitized, user-friendly error messages without exposing Prisma SQL queries, file paths, or stack traces.

---

## 7. Performance Targets & Bundle Constraints

- **Lighthouse Production Thresholds**:
  - Performance: $\ge 90$
  - Accessibility: $\ge 95$
  - Best Practices: $\ge 95$
  - SEO: $\ge 95$
- **Core Web Vitals Targets**:
  - LCP (Largest Contentful Paint): $< 2.5\text{s}$
  - INP (Interaction to Next Paint): $< 200\text{ms}$
  - CLS (Cumulative Layout Shift): $< 0.1$
- **Bundle Size Lock**: First Load JS shared by all must remain locked at **103 kB**.

---

## 8. Security Hardening in Production

- **HTTPS Enforcement**: Automatic HTTP $\to$ HTTPS 301 redirection via Vercel Edge.
- **Security Headers Verification**:
  - `Content-Security-Policy`: Default-src `'self'`, frame-ancestors `'none'`, object-src `'none'`.
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`.
  - `X-Frame-Options`: `DENY`.
  - `X-Content-Type-Options`: `nosniff`.
  - `Referrer-Policy`: `strict-origin-when-cross-origin`.
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(), browsing-topics=()`.
  - `X-Powered-By`: Suppressed.
- **Cookie Flags**: All authentication cookies (`__Secure-next-auth.session-token` or custom session JWT) set with `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
- **Build Log Inspection**: Verify that build output does not print `process.env` keys or values.

---

## 9. SEO & Search Engine Verification

- **Production Sitemap**: Access `https://<domain>/sitemap.xml`, verify all 3 published articles and active categories return 200 OK.
- **Crawler Directives**: Access `https://<domain>/robots.txt`, verify:
  ```text
  User-agent: *
  Disallow: /secure-console-x7/
  Disallow: /api/
  Disallow: /me/
  Disallow: /word-bank
  Sitemap: https://<domain>/sitemap.xml
  ```
- **Google Search Console (GSC)**: Provide DNS TXT verification token or HTML meta tag integration plan.
- **Social Sharing**: Validate `https://<domain>/api/og` rendering via Facebook Sharing Debugger and Twitter Card Validator.

---

## 10. Detailed Testing Plan

### 12A Testing: Infrastructure Validation
- Test 1: Verify Vercel CLI link (`npx vercel whoami`).
- Test 2: Verify environment variables configuration (`npx vercel env ls`).
- Test 3: Test Neon database connectivity from serverless function (`/api/health` or DB smoke script).

### 12B Testing: Preview Deployment Smoke Tests (10+ Tests)
1. **[TC-PREV-01]** Homepage HTTP 200, First Contentful Paint $< 1.5\text{s}$.
2. **[TC-PREV-02]** Article Catalog HTTP 200, category and CEFR badges present.
3. **[TC-PREV-03]** Reader Experience: Load published article, sentence slicing active, translation toggle operational.
4. **[TC-PREV-04]** Search & Trigram Filter: Search term returns matching results $< 500\text{ms}$.
5. **[TC-PREV-05]** Search Suggestions: Dropdown returns suggestions for $\ge 2$ characters.
6. **[TC-PREV-06]** Admin Authentication: Access `/secure-console-x7`, log in with admin credentials.
7. **[TC-PREV-07]** Admin CMS Mutation: Create draft article, publish, verify visible in public catalog.
8. **[TC-PREV-08]** Learner Authentication: Register new test learner, log in.
9. **[TC-PREV-09]** Personal Word Bank: Save vocabulary from reader, verify saved in `/word-bank`.
10. **[TC-PREV-10]** Reading Progress Persistence: Scroll article, verify progress updates and reflects in `/me/progress`.
11. **[TC-PREV-11]** Security Headers Inspection: `curl -I https://<preview-url>` asserts all 6 security headers.
12. **[TC-PREV-12]** Lighthouse Audit: Performance $\ge 90$, A11y $\ge 95$, SEO $\ge 95$.

### 12C Testing: Production Deployment Smoke Tests (5+ Tests)
1. **[TC-PROD-01]** Production Domain HTTPS 200, SSL certificate validity check.
2. **[TC-PROD-02]** Homepage load time $< 2\text{s}$ over public CDN.
3. **[TC-PROD-03]** Reader page load $< 3\text{s}$, zero hydration errors in browser console.
4. **[TC-PROD-04]** Admin Console stealth route inaccessible from public navigation; login functional.
5. **[TC-PROD-05]** Security Headers verification via `curl -I https://<production-domain>`.
6. **[TC-PROD-06]** DNS propagation verification across global resolvers.

---

## 11. Regression Testing Plan

- **Local Suite Preservation**: All 430 tests (204 Vitest + 226 script tests) will remain untouched and must continue to pass 100% locally.
- **Preview URL Integration Regression**:
  - We will introduce `BASE_URL` parameter support in automated smoke test scripts so integration verifications can execute directly against the live Vercel Preview URL over HTTPS.
- **Production Testing Safety**:
  - Zero destructive automated testing against the Production database. Production testing will be strictly read-only smoke tests to prevent polluting production metrics and tables.

---

## 12. Files to Create / Modify

### Files to Create:
1. `.env.production.example`: Complete, documented template of all production environment variables.
2. `vercel.json`: Vercel project configuration including region (`sin1`), headers, and cron jobs.
3. `scripts/smoke-test.ts`: Automated HTTP smoke test script accepting `--url=<target-url>`.
4. `docs/deployment/vercel-setup.md`: Step-by-step deployment and infrastructure setup runbook.
5. `docs/deployment/rollback-procedure.md`: Step-by-step emergency rollback runbook.
6. `docs/deployment/preview-smoke-test.md`: Manual and automated preview smoke testing checklist.

### Files to Modify:
1. `package.json`: Add `"engines": { "node": ">=20.0.0" }`.
2. `prisma/schema.prisma`: Add `directUrl = env("DIRECT_URL")` to datasource block.
3. `docs/PROJECT_STATE.md`: Add ADR-023 and update status to Phase 12.

---

## 13. External Dependencies & Tools

- `vercel` CLI: Used via `npx vercel` for non-interactive project linking, environment variable pushing, and deployment.
- Zero new npm runtime packages (`package.json` runtime dependencies remain unchanged).

---

## 14. Risks & Mitigations

| Risk ID | Risk Description | Severity | Mitigation Strategy |
|---|---|:---:|---|
| **R1** | Database migration failure during deployment | High | Neon copy-on-write branch snapshot created before running `prisma migrate deploy`. |
| **R2** | Missing or incorrect environment variables in Vercel | High | Startup environment validator in Next.js + pre-deploy `vercel env ls` verification. |
| **R3** | DNS propagation delays or SSL issuance failure | Medium | Deploy to `*.vercel.app` first; verify full functionality before adding custom domain. |
| **R4** | CSP header blocks legitimate assets on production domain | Medium | Fully test and monitor browser console on Vercel Preview for 24 hours prior to promotion. |
| **R5** | Serverless cold start latency impacting first read | Low | Singapore region co-location (`sin1` + Neon `ap-southeast-1`), lightweight Next.js runtime. |
| **R6** | Credentials / secrets leak in Vercel build logs | Critical | Audit build scripts; verify zero `console.log(process.env)` in any build pipeline step. |
| **R7** | Rollback failure during production incident | Critical | Step-by-step dry-run of rollback procedure on Preview environment before production release. |

---

## 15. Emergency Rollback Plan (CRITICAL)

### Step 1: Pre-Deployment Safety Snapshot
Before deploying to production:
```bash
# 1. Create git tag
git tag phase-12-start
git push origin phase-12-start

# 2. Record current production deployment ID (if existing)
npx vercel deployment ls --prod

# 3. Create Neon DB snapshot branch
# (via Neon Dashboard or neon CLI: neon branches create backup-pre-phase-12)
```

### Step 2: Instant Application Rollback (< 30 seconds)
If production encounters fatal crashes or elevated error rates:
```bash
# Rollback instantly to previous production deployment
npx vercel rollback <previous-deployment-url-or-id> --yes
```

### Step 3: Database Migration Rollback (if schema changed)
```bash
# If migration failed or needs reversal:
npx prisma migrate resolve --rolled-back <migration-name>
# Or point Vercel connection string to pre-migration Neon branch
```

### Step 4: Verification of Rollback
```bash
curl -I https://<production-domain>/
# Assert HTTP 200 OK and expected release version
```

---

## 16. Definition of Done (DoD) Checklist

- [ ] All prerequisites verified and confirmed by user.
- [ ] Vercel project created and linked to GitHub repository.
- [ ] Neon Serverless PostgreSQL provisioned in Singapore region.
- [ ] Upstash Redis production instance configured.
- [ ] Object storage provisioned (Vercel Blob / R2).
- [ ] All environment variables configured on Vercel (Production, Preview).
- [ ] `prisma/schema.prisma` updated with `directUrl` and validated.
- [ ] `package.json` updated with Node 20 engines specification.
- [ ] Vercel Preview deployment successful.
- [ ] Production migrations executed successfully via `prisma migrate deploy`.
- [ ] Preview smoke tests: $\ge 10$ PASS.
- [ ] Preview regression tests executed against preview URL.
- [ ] Preview Lighthouse scores meet thresholds (Perf $\ge 90$, A11y $\ge 95$, SEO $\ge 95$).
- [ ] User formal approval granted to promote Preview to Production.
- [ ] Production deployment executed and promoted.
- [ ] Custom domain and SSL certificate active and verified.
- [ ] Production smoke tests: $\ge 5$ PASS.
- [ ] HTTP Security headers verified on production domain via `curl -I`.
- [ ] `sitemap.xml` and `robots.txt` accessible and verified on production.
- [ ] Google Search Console sitemap submitted.
- [ ] Rollback procedure documented and verified.
- [ ] Deployment runbook completed (`docs/deployment/vercel-setup.md`).
- [ ] `docs/PROJECT_STATE.md` updated with ADR-023.
- [ ] Git tags `phase-12-start` and `phase-12-complete` created.
- [ ] Final walkthrough report `docs/phases/PHASE_12_WALKTHROUGH.md` generated.

---

## 17. Ambiguities & Open Questions for User

Please answer or confirm the following 8 questions to allow Phase 12 execution to proceed:

1. **Custom Domain**: Do you already own a custom domain (e.g., `readtoimprove.com`), or should Phase 12 deploy directly to `readtoimprove.vercel.app` as the primary production domain?
2. **Infrastructure Accounts**: Have you created the accounts for:
   - Vercel?
   - Neon Serverless PostgreSQL?
   - Upstash Redis?
   - (Optional) Object storage?
3. **Region Confirmation**: Can you confirm provisioning both Vercel Serverless Functions and Neon DB in the **Singapore** region (`sin1` / `ap-southeast-1`) for optimal speed in Vietnam?
4. **Vercel Plan**: Are you on the Vercel **Hobby** (Free) tier or **Pro** tier?
5. **Object Storage**: Would you prefer **Vercel Blob** (simplest 1-click integration with Vercel) or **Cloudflare R2** (zero egress fee, requires S3 API config)?
6. **Production Seed Content**: Should we run the seed script on production to populate the 3 initial bilingual articles and 18 vocabulary words, or do you prefer an empty database where content is created solely via the stealth Admin CMS?
7. **Analytics**: Would you like to enable **Vercel Web Analytics** (native, zero client JS overhead, privacy-friendly), Google Analytics 4, or defer analytics?
8. **Deployment Workflow**: Do you prefer to deploy via Vercel GitHub Git integration (automatic deploy on push to `main`), or via Vercel CLI (`vercel --prod`)?

---

```
=============================================================================
  PHASE 12 PLAN PROPOSED — STATUS: WAIT
  Awaiting User Confirmation of Prerequisites, Questions & Plan Approval
=============================================================================
```
