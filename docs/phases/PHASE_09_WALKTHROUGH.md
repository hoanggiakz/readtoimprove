# Walkthrough — Phase 09: User Reading History & Progress Tracking

Phase 09 of **ReadToImprove** is fully implemented, verified, and passing 100% of all regression tests (198/198 tests across 8 suites) and live browser E2E flows. This walkthrough provides complete architectural verification, portable visual evidence references, and full unabridged raw stdout outputs for all automated test suites, typecheck, lint, and production build.

---

## 1. Key Accomplishments

### 1.1 Database Schema & Compound Indexes
- Implemented and deployed database migration `20260922000000_add_user_history_and_goals`:
  - Added `UserReadingGoal` table for personal weekly reading targets with unique constraint on `userId`.
  - Added high-performance compound index on `ReadingHistory`: `@@index([userId, lastReadAt(sort: Desc)])` for fast chronological history feeds.
  - Added filtering index on `ReadingHistory`: `@@index([userId, completed, lastReadAt(sort: Desc)])` for instantaneous completed vs. in-progress filtering.
  - Added compound index on `Favorite`: `@@index([userId, createdAt(sort: Desc)])` for fast favorited articles retrieval.
- Verified relational integrity, unique constraints, and cascade deletion guards.

### 1.2 Debounced Reading Progress & Monotonic Persistence
- Client-Side Progress Engine (`src/components/reader/reading-progress-bar.tsx`):
  - Tracks scroll position and computes reading completion percentage (0–100%).
  - Debounced at 5,000ms to eliminate server write hammering during active reading.
  - Automatic flush on document visibility change (`visibilitychange === 'hidden'`) and page exit (`pagehide`).
  - Subtle animated saving indicator dot showing live persistence status (green dot = saved, pulse = saving).
  - Anonymous visitor support: tracks reading progress in `localStorage` (`readtoimprove_guest_history`).
- Server Action (`src/lib/actions/reading-history.ts`):
  - `recordReadingProgressAction`: Strict monotonic progress guarantee via `Math.max(existing.progress, newProgress)`. Reading progress never regresses if users scroll back up.
  - Automatic completion threshold: automatically marks `completed = true` when progress reaches $\ge 90\%$.
  - Sliding-window rate limiter (60 req/min per user) to protect database resources.
  - Granular cache revalidation via `revalidateTag("user-history-${userId}")` and `revalidateTag("user-stats-${userId}")`.

### 1.3 Resume Reading UX
- `ResumeReadingBanner` (`src/components/reader/resume-reading-banner.tsx`):
  - Appears non-intrusively when an authenticated learner returns to an article with previous progress between 5% and 95%.
  - Displays previous progress percentage and one-click button to smoothly scroll directly to the saved position.
  - Dismissible with state preserved in `sessionStorage`.

### 1.4 Explicit Intent Favorites System
- Server Actions (`src/lib/actions/favorites.ts`):
  - `favoriteArticleAction`: Explicit intent favoriting with idempotent upsert, verifying article existence and PUBLISHED visibility.
  - `unfavoriteArticleAction`: Explicit intent unfavoriting with idempotent deletion.
  - Eliminates check-then-act toggle race conditions.
  - Immutable audit logging (`USER_FAVORITED_ARTICLE`, `USER_UNFAVORITED_ARTICLE`).
- Interactive Component (`src/components/public/favorite-button.tsx`):
  - Heart icon button with optimistic UI state transitions.
  - Unauthenticated visitors are redirected to `/login?returnUrl=...` with safe return URL sanitization.

### 1.5 Timezone-Aware Learning Analytics & Streak Engine
- Query Service (`src/lib/queries/user-stats.ts`):
  - Strictly calculates calendar days in `Asia/Ho_Chi_Minh` timezone (`formatDateInTimezone`).
  - Computes current streak and longest streak on-the-fly from timestamped reading history in sub-5ms (measured 4.80ms in `TC-DASH-06`).
  - Eliminates nocturnal cron batch job failures, stale cache states, and timezone boundary bugs.
  - Generates 7-day reading velocity activity array with day names and read counts.
- Pure SVG Activity Visualization (`src/components/me/weekly-activity-chart.tsx`):
  - Zero-dependency custom SVG bar chart (< 2KB bundle size).
  - Eliminates heavy chart library dependencies (Chart.js / Recharts) and React 19 peer-dependency conflicts.
  - 100% SSR-safe with zero hydration mismatch and full accessibility attributes (`role="img"`, `aria-label`).

### 1.6 Authenticated Learner Profile Hub (`/me/*`)
- Profile Navigation & Layout (`src/app/(public)/me/layout.tsx` & `me-nav-tabs.tsx`):
  - Unified sub-navigation across `/me` (Overview), `/me/progress` (Tiến độ), `/me/reading-history` (Lịch sử đọc), and `/me/favorites` (Bài viết đã lưu).
  - Integrated with global header via accessible avatar dropdown (`src/components/common/user-dropdown-menu.tsx`).
- Granular Privacy Controls (`src/components/me/clear-history-dialog.tsx`):
  - Modal dialog allowing users to selectively clear reading history by article, past 7 days, past 30 days, or all-time.
  - Accompanied by security audit log records (`USER_CLEARED_HISTORY`).

### 1.7 Security & Open Redirect Neutralization
- `sanitizeReturnUrl` (`src/lib/url-utils.ts`):
  - Strictly neutralizes open redirect attack vectors in authentication redirects:
    - Rejects external protocol schemes (`https://evil.com`).
    - Rejects protocol-relative URLs (`//evil.com`).
    - Rejects Windows directory backslashes (`\evil.com`).
    - Rejects control characters and malformed encoded payloads.
    - Preserves valid relative paths and internal search query parameters (e.g. `/articles/clean-energy?font=large`).

---

## 2. Automated Test Results

### 2.1 Phase 9 Verification Suite (`scripts/verify-history-progress.ts`)
Total Tests: **45 / 45 PASSED (100%)**

- `TC-HIST-01` to `TC-HIST-10`: Reading history creation, atomic updates, monotonic preservation, chronological sorting, category & CEFR filtering, single article deletion, 7-day deletion, all-time deletion, and empty state handling.
- `TC-PROG-01` to `TC-PROG-08`: Progress completion logic (< 90% in-progress, $\ge 90\%$ completed), boundary validation (0–100), lastReadAt updates, idempotent repeated completion saves, multi-article tracking, guest history validation, and guest history account merging.
- `TC-FAV-01` to `TC-FAV-08`: Explicit favorite and unfavorite actions, duplicate call idempotence, non-existent/draft article rejection, chronological sorting, faceted filtering, and cascade deletion.
- `TC-STRK-01` to `TC-STRK-06`: 1-day streak, multi-day consecutive streaks, yesterday-read streak preservation, calendar gap reset to 0, same-day duplicate aggregation, and `Asia/Ho_Chi_Minh` timezone boundary date formatting.
- `TC-DASH-01` to `TC-DASH-06`: Total articles read aggregation, total reading time calculation, completed vs in-progress counts, 7-day activity array generation, `UserReadingGoal` configuration, and dashboard aggregation query latency (< 50ms benchmark; measured 4.80ms).
- `TC-SEC-01` to `TC-SEC-07`: History tenant isolation, favorites tenant isolation, Zod input validation bounds, protocol-relative open redirect rejection, external scheme redirect rejection, sliding-window rate limiting (> 60 req/min), and mutation audit logging.

### 2.2 Full Regression Suite (All 8 Phases)
All test suites across the repository were executed against the updated codebase:
- `scripts/verify-db.ts`: **10/10 PASS**
- `scripts/verify-auth.ts`: **10/10 PASS**
- `scripts/verify-admin.ts`: **20/20 PASS**
- `scripts/verify-public.ts`: **20/20 PASS**
- `scripts/verify-reader.ts`: **26/26 PASS**
- `scripts/verify-word-bank.ts`: **35/35 PASS**
- `scripts/verify-search.ts`: **32/32 PASS**
- `scripts/verify-history-progress.ts`: **45/45 PASS**

### 2.3 Test Count Breakdown

| Suite | Tests | Result | Primary Coverage Area |
|---|---|---|---|
| `verify-db.ts` | 10 | PASS | Database connectivity, schema constraints, cascade delete, relations |
| `verify-auth.ts` | 10 | PASS | JWT cryptographic sessions, bcrypt, stealth route guard, brute-force rate limit |
| `verify-admin.ts` | 20 | PASS | Stealth Admin CMS, CRUD, lifecycle state machine, offset slicing, audit logs |
| `verify-public.ts` | 20 | PASS | Public homepage, catalog, SEO, visibility security, category/CEFR browsing |
| `verify-reader.ts` | 26 | PASS | Bilingual reader, sentence slicing, translation visibility modes, audio popovers |
| `verify-word-bank.ts` | 35 | PASS | Word Bank page, trigram search, save/unsave actions, tenant isolation |
| `verify-search.ts` | 32 | PASS | PostgreSQL hybrid FTS, autocomplete, GIN indexes, rate limit, SQLi/XSS |
| `verify-history-progress.ts` | 45 | PASS | Reading history, debounce, monotonic progress, favorites, streaks, open redirect |
| **TOTAL** | **198** | **PASS** | **100% automated test pass rate across all 8 phases** |

### 2.4 Coverage Report
- Test scripts use standalone TypeScript execution via `npx tsx scripts/verify-*.ts`.
- Formal test runner code coverage tooling (e.g. Jest/Vitest with c8/istanbul) is currently: **Coverage tooling not configured**.
- **Reason**: The project architecture currently executes end-to-end integration and specification verification scripts directly against PostgreSQL and Next.js APIs. Comprehensive unit test runner setup and code coverage reporting are explicitly scheduled for **Phase 11 (Testing & Security Audit)**.

---

## 3. Browser E2E Verification & Visual Evidence

The browser subagent executed a comprehensive end-to-end interactive verification on the local production-mode server (`http://localhost:3000`):

1. **User Authentication**: Logged in as `learner@example.com` / `Learner2026!Password`.
2. **Profile Overview (`/me`)**: Inspected account summary, quick stats cards, and recent reads.
3. **Progress Dashboard (`/me/progress`)**: Verified streak counter, pure SVG 7-day activity chart, and weekly reading goal target card.
4. **Reading History List (`/me/reading-history`)**: Verified reading cards with progress bars, timestamps, and history clearing modal trigger.
5. **Favorites Grid (`/me/favorites`)**: Verified favorited articles display with CEFR badges and reading links.
6. **Header User Dropdown**: Tested interactive avatar dropdown menu with direct links to `/me`, `/me/progress`, `/me/reading-history`, `/me/favorites`, `/word-bank`, and logout.
7. **Article Reader Integration**: Visited article `/articles/clean-energy-microgrids-urban-resilience`; verified reading progress bar, save status dot, and favorite heart button.

### Visual Evidence Files

All screenshots are stored in portable relative paths within the repository:
- Overview Dashboard: [01_profile_overview.png](docs/phases/phase-09/evidence/01_profile_overview.png)
- Learning Progress & SVG Chart: [02_progress_dashboard.png](docs/phases/phase-09/evidence/02_progress_dashboard.png)
- Reading History Feed: [03_reading_history_list.png](docs/phases/phase-09/evidence/03_reading_history_list.png)
- Favorites Grid: [04_favorites_grid.png](docs/phases/phase-09/evidence/04_favorites_grid.png)
- Header User Dropdown: [05_header_user_dropdown.png](docs/phases/phase-09/evidence/05_header_user_dropdown.png)
- Article Reader Progress Bar: [06_article_reader_progress.png](docs/phases/phase-09/evidence/06_article_reader_progress.png)
- Full E2E Session Recording: [phase09_verification_session.webp](docs/phases/phase-09/evidence/phase09_verification_session.webp)

---

## 4. Known Issues / Tech Debt

### K1 — Offline Reading Sync
- Guest progress stored in `localStorage` requires active network connectivity to merge on authentication. Full offline service worker caching and background sync will be addressed during Phase 12.

### K2 — Multi-Device Live Synchronization
- Reading on two separate devices concurrently does not synchronize scroll positions in real time via WebSockets. Progress is synchronized upon tab focus or page reload.

### K3 — Rate Limit IP Header Trust (Inherited)
- Client IP extraction in `src/lib/rate-limit.ts` falls back to `127.0.0.1` in local environments without trusted edge proxy headers. Enforcing Vercel edge proxy header trust is scheduled for Phase 11 / 12 deployment.

---

## 5. Seed Data Dependencies

### E2E Test Data Required

| Entity | Value | Source |
|---|---|---|
| User | `learner@example.com` | `prisma/seed.ts` |
| Article slug | `clean-energy-microgrids-urban-resilience` | `prisma/seed.ts` |
| Category slug | `technology` (Display: Công nghệ) | `prisma/seed.ts` |
| CEFR level | `B2` | `prisma/seed.ts` |

---

## 6. Artifacts Updated

### A. Files Created/Modified
- [x] `docs/api/openapi.yaml` — **UPDATED** (Added `/api/me/*` endpoints)
- [x] `docs/PROJECT_STATE.md` — **UPDATED** (Phase 09 PASS, ADR-013, ADR-014, ADR-015)
- [x] `docs/phases/PHASE_09_REPORT.md` — **CREATED**
- [x] `docs/phases/PHASE_09_WALKTHROUGH.md` — **CREATED**

### B. Git Status
- Pre-phase tag: `phase-09-start`
- Feature branch: `feat/phase-09`

---

## Appendix A: Raw Verification Outputs

### A.1 Phase 9 Verification Suite (`scripts/verify-history-progress.ts`)
Command: `npx tsx scripts/verify-history-progress.ts`
Exit code: 0

```text
=================================================================
  READTOIMPROVE — PHASE 9 READING HISTORY & PROGRESS (45 TESTS)
=================================================================

--- Setting up isolated test fixtures ---
Fixtures initialized: Users (cmub8r8u50000np4c3wpx3z15, cmub8r8ud0001np4cihqy34x2), Category (cmub8r8ug0002np4cl94criza), Articles (4)

--- 9.1 Reading History CRUD & Filtering ---
✅ PASS [TC-HIST-01] Create initial reading history record
✅ PASS [TC-HIST-02] Update existing history progress atomically
✅ PASS [TC-HIST-03] Monotonic progress preservation
✅ PASS [TC-HIST-04] Query history sorted by lastReadAt DESC
✅ PASS [TC-HIST-05] Filter history records by category slug
✅ PASS [TC-HIST-06] Filter history records by CEFR level
✅ PASS [TC-HIST-07] Clear history for a single article
✅ PASS [TC-HIST-08] Clear history within 7-day timeframe
✅ PASS [TC-HIST-09] Clear all history records for a user
✅ PASS [TC-HIST-10] Empty state handling

--- 9.2 Reading Progress & Completion Logic ---
✅ PASS [TC-PROG-01] completed = false when progress < 90%
✅ PASS [TC-PROG-02] completed = true when progress >= 90%
✅ PASS [TC-PROG-03] Progress boundary validation (0 - 100)
✅ PASS [TC-PROG-04] lastReadAt updates on progress change
✅ PASS [TC-PROG-05] Idempotent repeated 100% completion saves
✅ PASS [TC-PROG-06] Reading progress persistence for multiple articles
✅ PASS [TC-PROG-07] Anonymous visitor guest history schema validation
✅ PASS [TC-PROG-08] Merge guest history into user account

--- 9.3 Favorites Explicit Intent ---
✅ PASS [TC-FAV-01] Explicit favoriteArticleAction adds article
✅ PASS [TC-FAV-02] Explicit unfavoriteArticleAction removes article
✅ PASS [TC-FAV-03] Duplicate favorite call is idempotent
✅ PASS [TC-FAV-04] Duplicate unfavorite call is idempotent
✅ PASS [TC-FAV-05] Rejection of favorite on non-existent/draft article
✅ PASS [TC-FAV-06] Query favorites sorted by createdAt DESC
✅ PASS [TC-FAV-07] Filter favorites by category and CEFR level
✅ PASS [TC-FAV-08] Cascade deletion of favorite on article removal

--- 9.4 Streak Calculation & Edge Cases ---
✅ PASS [TC-STRK-01] Calculate 1-day streak when read today only
✅ PASS [TC-STRK-02] Calculate multi-day streak for consecutive days
✅ PASS [TC-STRK-03] Preserve streak when read yesterday but not today
✅ PASS [TC-STRK-04] Reset streak to 0 when a calendar gap occurs
✅ PASS [TC-STRK-05] Multiple reads on same day count as 1 streak day
✅ PASS [TC-STRK-06] Timezone boundary date formatting (Asia/Ho_Chi_Minh)

--- 9.5 Learning Dashboard Aggregation ---
✅ PASS [TC-DASH-01] Aggregate total articles read (all-time & periods)
✅ PASS [TC-DASH-02] Calculate total estimated reading time
✅ PASS [TC-DASH-03] Accurate count of completed vs in-progress
✅ PASS [TC-DASH-04] Generate 7-day reads activity array
✅ PASS [TC-DASH-05] Configure and retrieve UserReadingGoal
✅ PASS [TC-DASH-06] Dashboard aggregation query latency < 50ms — 4.80ms

--- 9.6 Security & Tenant Isolation ---
✅ PASS [TC-SEC-01] Tenant isolation in reading history
✅ PASS [TC-SEC-02] Tenant isolation in favorites
✅ PASS [TC-SEC-03] Input validation boundaries rejected by Zod
✅ PASS [TC-SEC-04] Open redirect rejection on protocol-relative URL
✅ PASS [TC-SEC-05] Open redirect rejection on external schemes and safe internal path allowed
✅ PASS [TC-SEC-06] Rate limit throttles progress updates at > 60 req/min
✅ PASS [TC-SEC-07] Audit log created for user mutation

--- Cleaning up test fixtures ---
Teardown complete.

=================================================================
  TEST SUMMARY
=================================================================
TOTAL: 45 | PASSED: 45 | FAILED: 0

All 45 Phase 9 tests passed successfully!
```

---

### A.2 Phase 8 Verification Suite (`scripts/verify-search.ts`)
Command: `npx tsx scripts/verify-search.ts`
Exit code: 0

```text
=================================================================
  READTOIMPROVE — PHASE 8 SEARCH & FILTER VERIFICATION SUITE (32 TESTS)
=================================================================

--- Setting up isolated search test fixtures ---
--- Fixtures ready. Running verification tests ---

✅ PASS [TC-SEARCH-01] Full-text English search returns published article matching keyword — Matched article A: true
✅ PASS [TC-SEARCH-02] Full-text English search handles stemming (sustainable -> sustainability) — Matched stemmed article: true
✅ PASS [TC-SEARCH-03] Vietnamese title trigram search returns correct article — Matched Vietnamese title: true
✅ PASS [TC-SEARCH-04] Vietnamese excerpt trigram search matches definition text — Matched excerpt text: true
✅ PASS [TC-SEARCH-05] Case-insensitive search parity ("QUANTUM" === "quantum") — Count upper: 1, lower: 1
✅ PASS [TC-SEARCH-06] Category filter isolates only articles in specified category — Total category articles: 1
✅ PASS [TC-SEARCH-07] CEFR filter isolates only articles matching target level — B2 count: 2, C1 count: 2
✅ PASS [TC-SEARCH-08] Combined search (q + category + level) produces exact intersection — Matched exactly 1 item: true
✅ PASS [TC-SEARCH-09] Draft and future articles strictly excluded from search — 0 draft/future articles leaked
✅ PASS [TC-SEARCH-10] Autocomplete suggestions returns top matches with category & CEFR — Suggestions count: 1
✅ PASS [TC-SEARCH-11] Autocomplete suggestions query < 2 characters safely returns empty array — Short queries bypassed
✅ PASS [TC-SEARCH-12] Relevance ranking places title matches above excerpt-only matches — Index A: 0, Index B: 1
✅ PASS [TC-SEARCH-13] Pagination page=1 and page=2 returns distinct non-overlapping sets — P1 ID: cmub8rcke0001npbgy3fk45jc, P2 ID: cmub8rckq0002npbguro9r5e0
✅ PASS [TC-SEARCH-14] Out-of-bounds pagination (page=9999) returns empty array without throwing — Items: 0
✅ PASS [TC-SEARCH-15] Negative or zero page number normalized safely to page 1 — Normalized page: 1
✅ PASS [TC-SEARCH-16] Empty search results returns totalCount: 0 and empty array — Total: 0
✅ PASS [TC-SEARCH-17] Punctuation and special search characters sanitized safely — Executed without Postgres syntax error
✅ PASS [TC-SEARCH-18] Search highlight component generates valid React tree safely — Tokenized without dangerouslySetInnerHTML
✅ PASS [TC-SEARCH-19] Search query schema parses valid query parameters according to OpenAPI contract — {"q":"energy","category":"technology","level":"B2","page":1,"limit":12}
✅ PASS [TC-SEARCH-20] Suggestions query schema enforces 2 characters minimum — Valid: true, Short: true
✅ PASS [TC-SEARCH-21] URL state sync contract produces valid query string matching search state — q=quantum&category=tech&level=C1&page=2
✅ PASS [TC-SEARCH-22] Exclude ID option excludes specified spotlight article from search results — All had A: true, Excluded had A: false
✅ PASS [TC-SEARCH-23] Trigram index scan verified via EXPLAIN ANALYZE on Article table — Bitmap Index Scan confirmed on Article_titleVi_trgm_idx
✅ PASS [TC-SEARCH-24] searchVector GIN index scan verified via EXPLAIN ANALYZE on English query — Bitmap Index Scan confirmed on Article_searchVector_idx
✅ PASS [TC-SEC-01] XSS injection attempt in search query handled safely — Parameterized and escaped without script execution
✅ PASS [TC-SEC-02] SQL injection attempt neutralized by parameterized SQL template — Article table intact (count: 7)
✅ PASS [TC-SEC-03] Oversized query string (> 10,000 chars) rejected by Zod schema — Rejected with validation error
✅ PASS [TC-SEC-04] Rate limiter blocks search requests exceeding 60 req/min — Rate limit enforced after 60 requests
✅ PASS [TC-SEC-05] Rate limiter blocks suggestion requests exceeding 120 req/min — Rate limit enforced after 120 requests
✅ PASS [TC-SEC-06] Invalid CEFR enum value safely rejected by schema — Rejected malformed CEFR parameter
✅ PASS [TC-SEC-07] Invalid category slug handled gracefully (0 results, no 500 error) — Total: 0
✅ PASS [TC-SEC-08] No Prisma credentials or secret environment variables leaked to search DTOs — Payload clean and sanitized

--- Cleaning up search test fixtures ---
Cleanup completed successfully.

=================================================================
SUMMARY: 32/32 TESTS PASSED (100%)
=================================================================
```

---

### A.3 Phase 7 Verification Suite (`scripts/verify-word-bank.ts`)
Command: `npx tsx scripts/verify-word-bank.ts`
Exit code: 0

```text
=================================================================
  READTOIMPROVE — PHASE 7 WORD BANK VERIFICATION SUITE (35 TESTS)
=================================================================

✅ PASS [TC-WB-01] Unauthenticated visitor to /word-bank blocked / redirected — Redirect to /login enforced on unauthenticated access
✅ PASS [TC-WB-02] Authenticated user can query own Word Bank — Retrieved page for userA, items count: 0
✅ PASS [TC-WB-03] Server actions derive userId strictly from session — External client cannot spoof userId; rejected with UNAUTHORIZED
✅ PASS [TC-WB-04] User A cannot read User B's saved vocabulary — Strict tenant isolation; User A sees 0 of User B items
✅ PASS [TC-WB-05] Save vocabulary creates valid record linked to current user — Created UserSavedVocabulary id: cmub8rfva000cnpy82ec0nc5j
✅ PASS [TC-WB-06] Duplicate save prevented via unique constraint & atomic upsert — Count after duplicate save is exactly 1
✅ PASS [TC-WB-07] Save nonexistent vocabulary ID safely rejected (NOT_FOUND) — Existence check prevents orphaned join record
✅ PASS [TC-WB-08] Save operation preserves global Vocabulary integrity — Global vocabulary entity remains unchanged
✅ PASS [TC-WB-09] Unauthenticated save attempt returns UNAUTHORIZED — Vui lòng đăng nhập để lưu từ vựng vào sổ từ cá nhân.
✅ PASS [TC-WB-10] Unsave vocabulary deletes relation — Deleted 1 record(s), remaining: 0
✅ PASS [TC-WB-11] Unsave non-saved vocabulary is idempotent safe no-op — Idempotent execution returned count: 0
✅ PASS [TC-WB-12] User A cannot delete or unsave User B's vocabulary — Cross-user deletion rejected; User B record intact
✅ PASS [TC-WB-13] Unsaving does not cascade delete global Vocabulary — Vocabulary record preserved in global catalog
✅ PASS [TC-WB-14] Reader identifies unsaved vocabulary correctly — testVocab2 correctly marked not saved
✅ PASS [TC-WB-15] Reader identifies saved vocabulary correctly (batch lookup) — Identified saved vocab: cmub8rfts0002npy8uha781pu
✅ PASS [TC-WB-16] Unauthenticated reader executes zero saved vocabulary queries — 0 DB queries for anonymous visitors
✅ PASS [TC-WB-17] Batch reader query eliminates N+1 query pattern — 1 single query fetches all article saved vocabularies
✅ PASS [TC-WB-18] Word Bank sorts by savedAt DESC — Most recently saved vocabulary appears first
✅ PASS [TC-WB-19] Search by English word (case-insensitive trigram index) — Matched 1 item(s)
✅ PASS [TC-WB-20] Search by Vietnamese definition (case-insensitive trigram index) — Matched 1 item(s)
✅ PASS [TC-WB-21] CEFR level filtering isolates matching items — B2 count: 1, C1 count: 1
✅ PASS [TC-WB-22] Combined search and CEFR filter yields exact intersection — Match: 1, Mismatch: 0
✅ PASS [TC-WB-23] Server-side pagination computes totalPages, skip, and take correctly — Page 1: sustainable-1789994925251, Page 2: resilience-1789994925251
✅ PASS [TC-WB-24] Context preservation (article + sentence reference) — Context article: "Next-Generation Urban Energy Resilience"
✅ PASS [TC-WB-25] Graceful fallback to vocabulary examples when no article instance — Context is null; fallback example: "Urban resilience is critical for modern cities."
✅ PASS [TC-WB-26] Private Word Bank metadata has robots: { index: false, follow: false } — Search engines explicitly prevented from indexing user Word Bank
✅ PASS [TC-WB-27] Empty state rendered when 0 records found — Total: 0, items: 0 triggers WordBankEmpty component
✅ PASS [TC-SEC-01] XSS attempt in search query handled safely — XSS string sanitized and parameterized without execution
✅ PASS [TC-SEC-02] SQL injection attempt in search parameterized and neutralized — Prisma prepared statements prevent injection payload
✅ PASS [TC-SEC-03] Extremely long input (>10,000 chars) rejected by Zod schema — Rejected by schema max 100 character restriction
✅ PASS [TC-SEC-04] Concurrent saves (10x Promise.all) race-condition free — 10 parallel saves resulted in exactly 1 record
✅ PASS [TC-SEC-05] Rate limiter blocks requests exceeding 30 req/min — Rate limit enforced after 30 requests within 1 minute window
✅ PASS [TC-SEC-06] Pagination boundaries (page=0, page=-1, page=999999) clamped safely — pZero: 1, pNegative: 1, pHuge: 1
✅ PASS [TC-SEC-07] CSRF and invalid payload validation integrity — Empty or malformed payload rejected before database interaction
✅ PASS [TC-SEC-08] No Prisma credentials or DB connection strings leaked to client DTOs — All database URLs, secrets, and password hashes sanitized from DTOs

=================================================================
SUMMARY: 35/35 TESTS PASSED (100%)
=================================================================
```

---

### A.4 Phase 6 Verification Suite (`scripts/verify-reader.ts`)
Command: `npx tsx scripts/verify-reader.ts`
Exit code: 0

```text
=================================================================
  READTOIMPROVE — PHASE 6 ARTICLE READER VERIFICATION SUITE
=================================================================

--- Setting up isolated test fixtures ---
Created test fixtures with prefix: test-reader-1789994930795

✅ PASS [TC-READER-01] Public article loads through slug — Article ID: cmub8rk3t0001npfwonab9a7p, sentences count: 2
✅ PASS [TC-READER-02] Reader only loads published articles
✅ PASS [TC-READER-03] Future scheduled article cannot be read — Lookup for future article returned null
✅ PASS [TC-READER-04] Draft article cannot be read
✅ PASS [TC-READER-05] Pending-review article cannot be read
✅ PASS [TC-READER-06] Archived article cannot be read
✅ PASS [TC-READER-07] Sentences returned in deterministic order (orderIndex ASC) — Orders: 0 -> 1
✅ PASS [TC-READER-08] Exact English sentence content preserved after highlight slicing — Original length: 90, reconstructed length: 90
✅ PASS [TC-READER-09] Exact Vietnamese translation preserved exactly
✅ PASS [TC-READER-10] Sentence/article relation integrity — All sentences linked to article cmub8rk3t0001npfwonab9a7p
✅ PASS [TC-READER-11] Vocabulary associations resolve correctly through SentenceVocabulary — Resolved word: test-reader-1789994930795-sustainable
✅ PASS [TC-READER-12] Vocabulary highlights preserve exact offset slices — Slice: 'test-reader-1789994930795-sustainable' === HighlightedText: 'test-reader-1789994930795-sustainable'
✅ PASS [TC-READER-13] Invalid/out-of-bounds offsets safely discarded without crashing — 3 malformed highlights discarded, 1 valid retained, text preserved: true
✅ PASS [TC-READER-14] Overlapping highlight safety (zero duplication, zero missing characters) — Overlapping highlight safely skipped; 2 highlights rendered; full text intact
✅ PASS [TC-READER-15] Article metadata resolves correctly — Title: Green Transition in Global Eco..., ReadingTime: 5min
✅ PASS [TC-READER-16] SEO metadata generated for public article — Canonical: /articles/test-reader-1789994930795-published
✅ PASS [TC-READER-17] Unpublished content does not generate public SEO metadata — Title returned: "Không tìm thấy bài viết | ReadToImprove"
✅ PASS [TC-READER-18] Source attribution is present — Source: International Financial Review (https://example.com/ifr)
✅ PASS [TC-READER-19] No internal or admin metadata in reader DTO — Zero internal metadata detected in serialized client payload
✅ PASS [TC-READER-20] Client/server boundary integrity (sentence-slicer has zero Prisma dependency) — sliceSentenceText is pure portable text utility
✅ PASS [TC-READER-21] Translation and font-size persistence contract verified — Modes: ALL, INTERACTIVE, HIDE | Fonts: SMALL, MEDIUM, LARGE, EXTRA_LARGE
✅ PASS [TC-READER-22] Long content slicing performance benchmark (< 20ms for 100 sentences) — Sliced 8800 characters with 50 highlights in 0.10ms
✅ PASS [TC-READER-23] Missing or null vocabulary relation handled safely without throwing — Orphan highlight gracefully sliced without exception
✅ PASS [TC-READER-24] Article with zero sentences handled gracefully — Article loaded cleanly; sliceSentenceText returned [] on empty text
✅ PASS [TC-READER-25] Keyboard-accessible vocabulary interaction (dialog role, Esc dismiss, focus return) — Vocabulary token provides aria-haspopup="dialog" and aria-expanded
✅ PASS [TC-READER-26] Keyboard-accessible translation controls (aria-expanded, aria-pressed, keyboard toggle) — Translation button supports Enter/Space activation and touch reveal

--- Cleaning up test fixtures ---
Cleaned up 6 test articles.
Cleaned up test vocabulary: cmub8rk3l0000npfwelzyo8n8

=================================================================
  TEST SUMMARY
=================================================================
Total Tests : 26
Passed      : 26
Failed      : 0
=================================================================

🎉 ALL 26 ARTICLE READER TESTS PASSED (26/26)!
```

---

### A.5 Phase 5 Verification Suite (`scripts/verify-public.ts`)
Command: `npx tsx scripts/verify-public.ts`
Exit code: 0

```text
=================================================================
  READTOIMPROVE — PHASE 5 PUBLIC DISCOVERY VERIFICATION SUITE
=================================================================

--- Setting up isolated test fixtures ---
Created 5 test articles with prefix: test-pub-1789994934699

✅ PASS [TC-PUBLIC-01] Homepage discovery data loads successfully — Spotlight: Published Article Title test-p..., Latest: 4 items, Categories: 6
✅ PASS [TC-PUBLIC-02] Only published articles are returned — Verified 4 articles all have status=PUBLISHED and publishedAt <= now
✅ PASS [TC-PUBLIC-03] Future scheduled articles are hidden — Future article excluded from list and slug lookup returned null
✅ PASS [TC-PUBLIC-04] Draft articles are hidden — Draft article excluded from list and slug lookup returned null
✅ PASS [TC-PUBLIC-05] Pending-review articles are hidden — Pending-review article excluded from list and slug lookup returned null
✅ PASS [TC-PUBLIC-06] Archived articles are hidden — Archived article excluded from list and slug lookup returned null
✅ PASS [TC-PUBLIC-07] Latest article ordering is deterministic — Verified strict [publishedAt DESC, id DESC] ordering
✅ PASS [TC-PUBLIC-08] Pagination does not expose unpublished content and bounds query sizes — Page 1 (2 items) and Page 2 (2 items) have 0 overlap
✅ PASS [TC-PUBLIC-09] Category filtering and slug lookup work — Filtered by test-pub-1789994934699-tech, found only test published article
✅ PASS [TC-PUBLIC-10] Invalid category slug handled gracefully — Returns empty array without error: []
✅ PASS [TC-PUBLIC-11] CEFR A1-C2 filtering works — All 2 articles matched CEFR level B2
✅ PASS [TC-PUBLIC-12] Invalid CEFR level rejected safely — Normalized invalid CEFR value to undefined without throwing
✅ PASS [TC-PUBLIC-13] Search query validation (< 2 characters bypassed) — 1-character query ignored in Zod and query service
✅ PASS [TC-PUBLIC-14] Search only returns public articles (drafts hidden) — Matched published article (cmub8rn4d0001nppoj7lw5uvc) and strictly excluded draft article
✅ PASS [TC-PUBLIC-15] Empty search results handled cleanly — Returns totalCount: 0 and empty articles array
✅ PASS [TC-PUBLIC-16] Public article slug resolves correctly — Article resolved with categories and 1 sentences
✅ PASS [TC-PUBLIC-17] Unpublished article direct access returns null (404 trigger) — All 4 non-public statuses correctly returned null on direct slug lookup
✅ PASS [TC-PUBLIC-18] SEO metadata generation — Title: "Published Article Title test-pub-1789994934699 xylophone-pub | Đọc Báo Song Ngữ | ReadToImprove", Canonical: /articles/test-pub-1789994934699-published
✅ PASS [TC-PUBLIC-19] Admin route remains private and blocked in robots.txt — Disallows: ["/secure-console-x7/*","/secure-console-x7","/api/admin/*"]
✅ PASS [TC-PUBLIC-20] Client/server boundary integrity and pure where-clause enforcement — Authoritative where clause enforces status=PUBLISHED and publishedAt <= now

--- Cleaning up test fixtures ---
Cleaned up 5 test articles.
Cleaned up test category: cmub8rn470000nppo14it8u5z

=================================================================
  TEST SUMMARY
=================================================================
Total Tests : 20
Passed      : 20
Failed      : 0
=================================================================

🎉 ALL 20 PUBLIC DISCOVERY TESTS PASSED (20/20)!
```

---

### A.6 Phase 4 Verification Suite (`scripts/verify-admin.ts`)
Command: `npx tsx scripts/verify-admin.ts`
Exit code: 0

```text
================================================================================
ReadToImprove Phase 4 — Private Admin CMS Verification Suite (20 Tests)
================================================================================

[✓ PASS] TC-ADMIN-01: Category CRUD Operations — Created category with slug 'test-p4-1789994941362-cat', updated nameVi to 'Chuyên mục đã cập nhật', read successfully.
[✓ PASS] TC-ADMIN-02: Article Creation + Categories + SEO Metadata — Article 'test-p4-1789994941362-art' created in DRAFT with category link and SEO fields.
[✓ PASS] TC-ADMIN-03: Article State Machine Lifecycle — DRAFT -> PENDING -> PUBLISHED -> ARCHIVED verified. publishedAt timestamp preserved when archived. Direct PUBLISHED->DRAFT forbidden.
[✓ PASS] TC-ADMIN-04: Sentence Creation & Unique Order Indexing — Sentences #0 and #1 created sequentially. Duplicate [articleId, orderIndex] rejected by unique constraint.
[✓ PASS] TC-ADMIN-05: Sentence Reorder Transaction Atomicity — Swapped sentence positions (s2->0, s1->1) inside atomic transaction without constraint collision.
[✓ PASS] TC-ADMIN-06: Offset Calculation & Slice Identity — findWordOffsets found 'sustainable' at [31:42]. Exact slice matches: 'sustainable'.
[✓ PASS] TC-ADMIN-07: Invalid Offset Bounds & Slice Rejection — Properly rejected negative start, inverted range, out-of-bounds end, and slice text mismatch.
[✓ PASS] TC-ADMIN-08: Sentence Vocabulary Tagging — Tagged vocabulary 'sustainable' to sentence at [31:42]. Resolved in sentence relational query.
[✓ PASS] TC-ADMIN-09: Global Vocabulary Entity Preservation on Cascade Delete — Article deletion cascaded to Sentence and SentenceVocabulary. Global Vocabulary record remains permanently preserved.
[✓ PASS] TC-ADMIN-10: Global Vocabulary Referenced Deletion Guard & Cleanup — Deletion correctly blocked while referenced by sentence (count=1). Unreferenced vocabulary deleted cleanly.
[✓ PASS] TC-ADMIN-11: User Status & Role Modification — User toggled to isActive: false -> true, role modified: USER -> ADMIN -> USER.
[✓ PASS] TC-ADMIN-12: Non-Admin Authorization Rejection (403 Enforcement) — Learner account (role: USER) rejected from admin operations; logged AUTHORIZATION_DENIED.
[✓ PASS] TC-ADMIN-13: Unauthenticated Admin Access Rejection — Direct invocation of createArticleAction() without authenticated session threw redirect/unauthorized error.
[✓ PASS] TC-ADMIN-14: Direct Server Action Authorization Guard — deleteArticleAction() strictly checked requireAdmin() before parsing input or querying database.
[✓ PASS] TC-ADMIN-15: Admin Route Crawling Protection in robots.ts — robots.txt strictly disallows ['/secure-console-x7/*', '/api/admin/*']. Zero search engine leakage.
[✓ PASS] TC-ADMIN-16: Comprehensive Self-Lockout & Sole-Admin Guard — Admin self-deactivation strictly blocked. Sole administrator demotion strictly blocked.
[✓ PASS] TC-ADMIN-17: Published Article Destructive-Action Policy Enforcement — Direct deletion of PUBLISHED article blocked. Article must be archived first before deletion.
[✓ PASS] TC-ADMIN-18: Administrative Mutation AuditLog Persistence — Audit record persisted: action='ARTICLE_CREATED', entityId='test-entity-18', actorId='cmtwzepg80005nplsoww2vnro'.
[✓ PASS] TC-ADMIN-19: Security Authorization Failure AuditLog Persistence — Security audit record persisted: action='AUTHORIZATION_DENIED', entity='Security', userId='cmub8rsbh000hnpesfua6mrzc'.
[✓ PASS] TC-ADMIN-20: Duplicate Slug & Invalid Input Rejection — Zod rejected malformed slug with spaces. Prisma unique constraint rejected duplicate category slug.

[CLEANUP] Cleaning up test records created during verification...
[CLEANUP] Cleanup complete.

================================================================================
SUMMARY: Total Tests: 20 | Passed: 20 | Failed: 0
================================================================================
```

---

### A.7 Phase 3 Verification Suite (`scripts/verify-auth.ts`)
Command: `npx tsx scripts/verify-auth.ts`
Exit code: 0

```text
================================================================================
ReadToImprove Phase 3 — Authentication & Security Verification Suite
================================================================================

[✓ PASS] TC-AUTH-01: Admin Authentication & Cryptographic Session Issuance — Admin password verified with bcrypt, JWT token issued and decoded with role: ADMIN.
[✓ PASS] TC-AUTH-02: Learner Authentication & Token Issuance — Learner password verified with bcrypt, JWT token decoded with role: USER.
[✓ PASS] TC-AUTH-03: Invalid Password Rejection — Incorrect password was properly rejected by bcrypt.compare; zero session issued.
[✓ PASS] TC-AUTH-04: Non-Existent User Rejection — Unregistered email correctly returned null; prevented authentication.
[✓ PASS] TC-AUTH-05: Zod Input Validation Enforcement — Zod schemas strictly rejected malformed emails and weak/short passwords with clear error messages.
[✓ PASS] TC-AUTH-06: Cryptographic Token Tamper Resistance — Tampered JWT signature was rejected by jose.jwtVerify; returned null.
[✓ PASS] TC-AUTH-07: Inactive / Disabled User Account Rejection — Disabled user (isActive: false) is prevented from obtaining an active session.
[✓ PASS] TC-AUTH-08: requireAdmin() Non-Admin Role Rejection (403 Forbidden) — Learner account (role: USER) was denied admin access with 403 Forbidden enforcement.
[✓ PASS] TC-AUTH-09: Security Audit Log Persistence — Verified security audit entry exists in PostgreSQL: Action="UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT", Entity="AdminConsole".
[✓ PASS] TC-AUTH-10: Sliding Window Brute-Force Rate Limiter — Rate limiter allowed 5 requests and blocked 6th request (allowed: false).

================================================================================
SUMMARY: Total Tests: 10 | Passed: 10 | Failed: 0
================================================================================
```

---

### A.8 Phase 2 Verification Suite (`scripts/verify-db.ts`)
Command: `npx tsx scripts/verify-db.ts`
Exit code: 0

```text
================================================================================
ReadToImprove Phase 2 — Automated Database & Integrity Verification Suite
================================================================================

[✓ PASS] TC-DB-01: Database Connectivity — Successfully connected to PostgreSQL on port 5433.
[✓ PASS] TC-DB-02: Seeded Record Counts Verification — Users: 2, Articles: 3, Categories: 5, Vocab: 18, Sentences: 9, Mappings: 18.
[✓ PASS] TC-DB-03: Deep Relational Traversal — Successfully traversed Article "How Next-Generation Clean Ener..." through Sentences to Vocabulary.
[✓ PASS] TC-DB-04: Offset Mathematical Bounds (startOffset >= 0, endOffset <= length, startOffset < endOffset) — All 18 vocabulary highlight offsets satisfy mathematical bounds.
[✓ PASS] TC-DB-05: Offset Slicing Identity (textEn.slice(start, end) === highlightedText) — All 18 vocabulary highlights identically match raw sentence slices.
[✓ PASS] TC-DB-06: Non-Overlapping Highlight Integrity — Zero overlapping highlight ranges detected across all seeded sentences.
[✓ PASS] TC-DB-07: Sentence Order Uniqueness ([articleId, orderIndex] Unique Constraint) — Prisma rejected duplicate orderIndex with P2002 Unique Constraint violation.
[✓ PASS] TC-DB-08: Transaction Atomicity & Rollback Verification — Transaction aborted cleanly on exception; 0 partial or orphaned records remained.
[✓ PASS] TC-DB-09: Global Vocabulary Preservation on Article Cascade Delete — Article deletion purged Sentence and SentenceVocabulary, but preserved global Vocabulary record.
[✓ PASS] TC-DB-10: User Saved Vocabulary & Reading History Relational Integrity — Verified learner profile has 1 saved word and 2 reading history record.

================================================================================
SUMMARY: Total Tests: 10 | Passed: 10 | Failed: 0
================================================================================
```

---

### A.9 TypeScript Typecheck
Command: `npm run typecheck`
Exit code: 0

```text
> readtoimprove@0.1.0 typecheck
> tsc --noEmit
```

---

### A.10 ESLint
Command: `npm run lint`
Exit code: 0

```text
> readtoimprove@0.1.0 lint
> eslint .
```

---

### A.11 Production Build
Command: `npm run build`
Exit code: 0

```text
> readtoimprove@0.1.0 build
> next build

   ▲ Next.js 15.5.25
   - Environments: .env.local, .env

   Creating an optimized production build ...
 ✓ Compiled successfully in 4.3s
   Linting and checking validity of types ...
   Collecting page data ...
   Generating static pages (0/23) ...
   Generating static pages (5/23) 
   Generating static pages (11/23) 
   Generating static pages (17/23) 
 ✓ Generating static pages (23/23)
   Finalizing page optimization ...
   Collecting build traces ...

Route (app)                                        Size  First Load JS
┌ ƒ /                                             136 B         125 kB
├ ○ /_not-found                                   156 B         103 kB
├ ƒ /api/me/favorites                             156 B         103 kB
├ ƒ /api/me/reading-history                       156 B         103 kB
├ ƒ /api/me/stats                                 156 B         103 kB
├ ƒ /api/search                                   156 B         103 kB
├ ƒ /api/search/suggestions                       156 B         103 kB
├ ƒ /articles                                     137 B         125 kB
├ ƒ /articles/[slug]                            9.74 kB         131 kB
├ ƒ /categories                                   185 B         107 kB
├ ƒ /categories/[slug]                            186 B         113 kB
├ ○ /login                                      3.17 kB         119 kB
├ ƒ /me                                           185 B         107 kB
├ ƒ /me/favorites                               1.92 kB         114 kB
├ ƒ /me/progress                                3.78 kB         120 kB
├ ƒ /me/reading-history                         5.59 kB         127 kB
├ ○ /register                                   3.37 kB         120 kB
├ ○ /robots.txt                                   156 B         103 kB
├ ƒ /secure-console-x7                            185 B         107 kB
├ ƒ /secure-console-x7/articles                    5 kB         138 kB
├ ƒ /secure-console-x7/articles/[id]/edit         135 B         137 kB
├ ƒ /secure-console-x7/articles/[id]/sentences     6 kB         137 kB
├ ƒ /secure-console-x7/articles/new               135 B         137 kB
├ ƒ /secure-console-x7/audit-logs               1.47 kB         104 kB
├ ƒ /secure-console-x7/categories               5.62 kB         117 kB
├ ƒ /secure-console-x7/users                    4.44 kB         132 kB
├ ƒ /secure-console-x7/vocabulary               3.78 kB         135 kB
└ ƒ /word-bank                                  5.91 kB         139 kB
+ First Load JS shared by all                    103 kB
  ├ chunks/1255-7316b50163a428e6.js             46.4 kB
  ├ chunks/4bd1b696-f785427dddbba9fb.js         54.2 kB
  └ other shared chunks (total)                    2 kB


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```
