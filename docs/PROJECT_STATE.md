# PROJECT STATE

## Current Status
- PHASE: 07 — Vocabulary & Personal Word Bank
- STATUS: WAIT
- LAST_UPDATED: 2026-09-13T12:52:00Z
- BRANCH: master

## Completed Phases
- [x] Phase 0 — Project Discovery (artifact: `/docs/00_DISCOVERY_AND_REQUIREMENTS.md` to `/docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md`)
- [x] Phase 1 — Project Foundation (artifact: `/docs/phases/PHASE_01_REPORT.md`, commit: `5b0f0be`)
- [x] Phase 2 — Database Persistence (artifact: `/docs/phases/PHASE_02_REPORT.md`, commit: `efd58b3`)
- [x] Phase 3 — Authentication & Stealth Admin (artifact: `/docs/phases/PHASE_03_REPORT.md`, commit: `7f0559b`)
- [x] Phase 4 — Private Admin CMS (artifact: `/docs/phases/PHASE_04_REPORT.md`, commit: `9fc0c92`)
- [x] Phase 5 — Public Discovery & Content Browsing (artifact: `/docs/phases/PHASE_05_REPORT.md`, commit: `fbaa6e7`)
- [x] Phase 6 — Article Reading Experience (artifact: `/docs/phases/PHASE_06_REPORT.md`, commit: `b73de4d`)
- [ ] Phase 7 — Vocabulary & Personal Word Bank (PLAN completed: `/docs/phases/PHASE_07_IMPLEMENTATION_PLAN.md`, awaiting user approval)

## Architecture Decisions (ADR)
- **ADR-001**: Signed cryptographic JWT sessions via `jose` + bcrypt password hashing + PostgreSQL session verification (`auth()`, `requireAuth()`, `requireAdmin()`).
- **ADR-002**: Stealth Admin base path configured at `/secure-console-x7` with `noindex, nofollow`, `robots.txt` exclusion, and zero public navigation exposure.
- **ADR-003**: PostgreSQL 16 containerized on Docker host port `5433` (container port `5432`) with Prisma ORM singleton client.
- **ADR-004**: Global `Vocabulary` entity preservation on Article cascade deletion; vocabulary remains a shared content asset reusable across articles and user word banks.
- **ADR-005**: Pure algorithmic sentence slicing engine (`src/lib/sentence-slicer.ts`) enforcing `startOffset ASC, endOffset ASC` with overlap skipping to guarantee 100% character fidelity without HTML injection.
- **ADR-006**: Authoritative public article visibility rule (`status === PUBLISHED && publishedAt !== null && publishedAt <= now`), throwing Next.js `notFound()` (404) on unpublished, draft, or future content.
- **ADR-007**: SSR-safe reader hydration defaults (`translationMode = ALL`, `fontSize = MEDIUM`) to ensure full search crawler indexing and eliminate hydration mismatches, with client synchronization via `localStorage` post-mount.
- **ADR-008**: Zero database migrations for Phase 7; reusing existing `UserSavedVocabulary` model with `[userId, vocabularyId]` unique constraint for atomic upsert and delete operations.

## Database Schema Version
- Last migration: `20260911131715_init_schema`
- Seed version: v1 (Original educational content seeder in `prisma/seed.ts`)

## API Contract Version
- Contract specification: Server Actions (`src/lib/actions/`) & Route Handlers (`src/app/api/`)
- Last breaking change: none

## Known Issues / Tech Debt
- None. All 5 regression verification suites (`verify-db.ts`, `verify-auth.ts`, `verify-admin.ts`, `verify-public.ts`, `verify-reader.ts`), `typecheck`, `lint`, and Next.js production `build` pass with 100% success.

## Next Phase
- PHASE 07 — Vocabulary & Personal Word Bank
- Implementation Plan: `/docs/phases/PHASE_07_IMPLEMENTATION_PLAN.md`
- Status: Awaiting user approval (`APPROVE PHASE 7`)
