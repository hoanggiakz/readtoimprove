# PROJECT STATE

## Current Status
- PHASE: 10.5 — Unit Test Framework Setup
- STATUS: WAIT
- RESULT: PASS
- LAST_UPDATED: 2026-09-23T21:10:00Z
- BRANCH: feat/phase-10.5

## Completed Phases
- [x] Phase 0 — Project Discovery (artifact: `/docs/00_DISCOVERY_AND_REQUIREMENTS.md` to `/docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md`)
- [x] Phase 1 — Project Foundation (artifact: `/docs/phases/PHASE_01_REPORT.md`, commit: `5b0f0be`)
- [x] Phase 2 — Database Persistence (artifact: `/docs/phases/PHASE_02_REPORT.md`, commit: `efd58b3`)
- [x] Phase 3 — Authentication & Stealth Admin (artifact: `/docs/phases/PHASE_03_REPORT.md`, commit: `7f0559b`)
- [x] Phase 4 — Private Admin CMS (artifact: `/docs/phases/PHASE_04_REPORT.md`, commit: `9fc0c92`)
- [x] Phase 5 — Public Discovery & Content Browsing (artifact: `/docs/phases/PHASE_05_REPORT.md`, commit: `fbaa6e7`)
- [x] Phase 6 — Article Reading Experience (artifact: `/docs/phases/PHASE_06_REPORT.md`, commit: `b73de4d`)
- [x] Phase 7 — Vocabulary & Personal Word Bank (artifact: `/docs/phases/PHASE_07_REPORT.md`, commit: `3520b86`)
- [x] Phase 8 — Search & Filter (artifact: `/docs/phases/PHASE_08_REPORT.md`, commit: `bfb406a`)
- [x] Phase 9 — User Reading History & Progress Tracking (artifact: `/docs/phases/PHASE_09_REPORT.md`, commit: `2516c94`)
- [x] Phase 10 — SEO / Accessibility / Performance (artifact: `/docs/phases/PHASE_10_REPORT.md`)
- [x] Phase 10.5 — Unit Test Framework Setup (artifact: `/docs/phases/PHASE_10_5_WALKTHROUGH.md`)

## Architecture Decisions (ADR)
- **ADR-001**: Signed cryptographic JWT sessions via `jose` + bcrypt password hashing + PostgreSQL session verification (`auth()`, `requireAuth()`, `requireAdmin()`).
- **ADR-002**: Stealth Admin base path configured at `/secure-console-x7` with `noindex, nofollow`, `robots.txt` exclusion, and zero public navigation exposure.
- **ADR-003**: PostgreSQL 16 containerized on Docker host port `5433` (container port `5432`) with Prisma ORM singleton client.
- **ADR-004**: Global `Vocabulary` entity preservation on Article cascade deletion; vocabulary remains a shared content asset reusable across articles and user word banks.
- **ADR-005**: Pure algorithmic sentence slicing engine (`src/lib/sentence-slicer.ts`) enforcing `startOffset ASC, endOffset ASC` with overlap skipping to guarantee 100% character fidelity without HTML injection.
- **ADR-006**: Authoritative public article visibility rule (`status === PUBLISHED && publishedAt !== null && publishedAt <= now`), throwing Next.js `notFound()` (404) on unpublished, draft, or future content.
- **ADR-007**: SSR-safe reader hydration defaults (`translationMode = ALL`, `fontSize = MEDIUM`) to ensure full search crawler indexing and eliminate hydration mismatches, with client synchronization via `localStorage` post-mount.
- **ADR-008**: UserSavedVocabulary model reused; addition of PostgreSQL `pg_trgm` extension and GIN indexes on `Vocabulary(word)` and `Vocabulary(meaningVi)` for sub-100ms ILIKE search performance.
- **ADR-009**: Explicit intent architecture for vocabulary save/unsave (`saveVocabularyAction` + `unsaveVocabularyAction`) eliminating check-then-act race conditions; tag-based revalidation via `revalidateTag`.
- **ADR-010**: Constant 3-query architecture for personal Word Bank page eliminating N+1 queries; batch-lookup of saved IDs on reader load.
- **ADR-011**: Incremental OpenAPI 3.1 adoption (`docs/api/openapi.yaml`) initiated with Phase 8 discovery endpoints (`/api/search`, `/api/search/suggestions`), with backfill schedule for previous phases documented in `docs/api/README.md`.
- **ADR-012**: Phase 0 documentation naming deviation: standardized on root `docs/00_DISCOVERY_AND_REQUIREMENTS.md` through `docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md` as primary BRD/FSD source of truth in place of `docs/phase-00/`.
- **ADR-013**: Reading Progress Debounce (5,000ms) & Monotonic Server Persistence (`Math.max(existing, new)`) with automatic completion threshold at $\ge 90\%$; client-side flush on `visibilitychange` and `pagehide`; guest reading fallback in `localStorage` merged atomically on authentication.
- **ADR-014**: Timezone-Aware Streak Calculation (`Asia/Ho_Chi_Minh`) & Pure SVG Learning Analytics without external chart libraries (eliminates React 19 dependency conflicts and 150KB+ bundle bloat; computed on-the-fly in < 5ms).
- **ADR-015**: Strict Open Redirect Neutralization via `sanitizeReturnUrl` (`src/lib/url-utils.ts`) rejecting protocol-relative URLs (`//`), Windows backslashes (`\`), control characters, and external schemes; enforcing safe internal relative navigation post-auth.
- **ADR-016**: Edge-Rendered Dynamic OpenGraph Image Generation via Next.js native `ImageResponse` (`@vercel/og` engine) with 1200x630 dark editorial styling, CEFR level badge, reading time, and 7-day CDN edge cache headers (`Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400`).
- **ADR-017**: Server-Rendered Schema.org Structured Data with Unicode Escaping (`\u003c`) to neutralize raw script injection vectors, providing `WebSite` with `SearchAction`, `NewsArticle`, and `BreadcrumbList`.
- **ADR-018**: Deterministic Modal Focus Trapping, Escape Dismissal, and Trigger Focus Restoration on Dialog Elements (`SearchCommandDialog`, `ClearHistoryDialog`) complying with WCAG 2.1 AA dialog patterns.
- **ADR-019**: Zero Client Bundle Growth Architecture for Metadata, Sitemaps, and Robots (100% Server Execution; First Load JS locked at 103 kB).
- **ADR-020**: Vitest & React Testing Library (RTL) Unit Test Infrastructure Adoption with native V8 engine code coverage (@vitest/coverage-v8), scoped threshold enforcement (lines $\ge 80\%$, branches $\ge 70\%$), path alias resolution via `vite-tsconfig-paths`, and zero production bundle impact (First Load JS maintained at 103 kB).

## Database Schema Version
- Last migration: `20260922000000_add_user_history_and_goals`
- Seed version: v1 (Original educational content seeder in `prisma/seed.ts`)

## API Contract Version
- Contract specification: OpenAPI 3.1 (`docs/api/openapi.yaml`), Server Actions (`src/lib/actions/`), Route Handlers (`src/app/api/`)
- Last breaking change: none

## Known Issues / Tech Debt
- Upstash Redis rate limiter operates with in-memory sliding window fallback in local dev without Redis credentials.
- External search engine (Meilisearch/Elasticsearch) migration deferred until catalog exceeds 10,000 articles and p95 search latency exceeds 200ms for 7 consecutive days.
- All 9 regression verification suites (`verify-db.ts`, `verify-auth.ts`, `verify-admin.ts`, `verify-public.ts`, `verify-reader.ts`, `verify-word-bank.ts`, `verify-search.ts`, `verify-history-progress.ts`, `verify-seo-a11y-perf.ts` — 226 tests total), Vitest unit test suite (12 tests), `typecheck`, `lint`, and Next.js production `build` pass with 100% success.
- Incremental expansion of unit test suites for new features (SRS algorithm, Flashcard decks) scheduled for Phase 11.

## Next Phases
- PHASE 11 — Flashcards & Spaced Repetition (SRS)
- Status: Awaiting user approval (`APPROVE PHASE 10.5`)


