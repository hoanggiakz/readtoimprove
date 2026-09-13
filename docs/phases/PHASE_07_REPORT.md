# PHASE 07 — PHASE REPORT

## 1. Phase
**PHASE 07 — VOCABULARY & PERSONAL WORD BANK**

```text
PHASE: 07
STATUS: WAIT
RESULT: PASS
COMMIT: PENDING_COMMIT
WORKTREE: CLEAN
NEXT: PHASE 08 — SEARCH & FILTER (DO NOT START AUTOMATICALLY)
```

---

## 2. Objective
Deliver the complete personal vocabulary management ecosystem for ReadToImprove, empowering English learners (CEFR B1–C2) to collect, organize, and retain authentic vocabulary encountered while reading bilingual news articles:
1. **Seamless Reader Integration**: Interactive save/unsave controls inside the article vocabulary popover with optimistic UI updates, error rollback, and graceful login prompts for anonymous visitors.
2. **Strict Multi-Tenant Isolation**: Ensure every user's Word Bank is completely isolated (`userId` derived strictly from authenticated cryptographic session; zero cross-user leakage).
3. **High-Performance Trigram Search**: Sub-100ms case-insensitive substring search across English headwords and Vietnamese definitions powered by PostgreSQL `pg_trgm` extension and GIN indexes.
4. **CEFR Level Filtering**: Instant multi-level filtering (`A1` to `C2` + `Tất cả`) combined with real-time text query.
5. **Contextual Sentence & Article Preservation**: Display authentic sentence quotes with highlighted vocabulary and back-links to the originating article.
6. **Graceful Fallbacks**: When vocabulary lacks article context, display default dictionary examples with natural fallback rendering.
7. **Accessible & Responsive UX**: WCAG 2.1 AA compliance with screen-reader live announcements (`aria-live="polite"`), focus restoration on deletion, accessible dialogs, and mobile optimization ($375 \times 667$).
8. **Robust Abuse Prevention & Rate Limiting**: Upstash Redis sliding window rate limiter (30 req/min) with in-memory fallback, Zod input validation, and audit log persistence in PostgreSQL.

---

## 3. Scope
- **In Scope**:
  - PostgreSQL database migration adding `pg_trgm` extension and GIN indexes on `Vocabulary(word)` and `Vocabulary(meaningVi)`.
  - Upstash Redis sliding window rate limiter (`src/lib/rate-limit.ts`) and audit logger (`src/lib/audit-log.ts`).
  - Secure Server Actions (`saveVocabularyAction`, `unsaveVocabularyAction`) using explicit intent architecture.
  - Data access query service (`src/lib/queries/vocabulary.ts`) eliminating $N+1$ queries through batch lookup.
  - Public reader integration: batch-fetching saved status in `src/app/(public)/articles/[slug]/page.tsx` and passing state to `vocabulary-popover.tsx`.
  - Global navigation update: "Sổ từ vựng" link in `src/components/common/header.tsx` for authenticated sessions.
  - Protected page `/word-bank` (`src/app/(public)/word-bank/page.tsx`, `loading.tsx`, `error.tsx`).
  - Full client component suite: `word-bank-header.tsx`, `word-bank-filter-bar.tsx`, `word-bank-card.tsx`, `word-bank-empty.tsx`, `word-bank-list.tsx`.
  - Comprehensive automated test suite `scripts/verify-word-bank.ts` covering 35 specifications (`TC-WB-01` to `TC-WB-27` and `TC-SEC-01` to `TC-SEC-08`).
  - Complete regression suite (121 total automated tests), typecheck, lint, production build, and browser E2E verification.
- **Out of Scope (Deferred to Future Phases)**:
  - Phase 08: Global search & filter across articles, tags, and categories.
  - Phase 09: User reading history, reading velocity tracking, and analytics.
  - Phase 10: Spaced repetition (SRS) flashcard review mode and vocabulary mastery quiz.

---

## 4. Files Created
1. `prisma/migrations/20260913130000_add_trigram_search/migration.sql`: Migration script enabling `pg_trgm` extension and GIN indexes.
2. `src/validations/word-bank.ts`: Zod validation schemas (`wordBankQuerySchema`, `saveVocabularySchema`, `unsaveVocabularySchema`).
3. `src/lib/rate-limit.ts`: Upstash Redis sliding window rate limiter (30 req/min) with robust in-memory dev fallback.
4. `src/lib/audit-log.ts`: Security and mutation audit logger writing directly to PostgreSQL `AuditLog`.
5. `src/lib/actions/vocabulary.ts`: Authenticated Server Actions for saving and unsaving vocabulary with atomic upsert, existence checks, and tenant isolation.
6. `src/lib/queries/vocabulary.ts`: Data access query service `getWordBankPage` with constant 3-query execution and $N+1$ prevention.
7. `src/components/word-bank/word-bank-header.tsx`: Page title, subtitle, and responsive saved word count badge.
8. `src/components/word-bank/word-bank-filter-bar.tsx`: Real-time search input, CEFR filter pills, and `aria-live` announcer.
9. `src/components/word-bank/word-bank-card.tsx`: Rich vocabulary card with audio pronunciation, IPA, POS, CEFR badge, definition, sentence context, and remove button.
10. `src/components/word-bank/word-bank-empty.tsx`: Accessible empty state with guidance and direct CTA link to explore articles.
11. `src/components/word-bank/word-bank-list.tsx`: Client coordinator handling list rendering, card removal, and focus restoration.
12. `src/app/(public)/word-bank/page.tsx`: Protected server page enforcing `requireAuth('/word-bank')` and `robots: { index: false, follow: false }`.
13. `src/app/(public)/word-bank/loading.tsx`: Skeleton loading grid for smooth page transitions.
14. `src/app/(public)/word-bank/error.tsx`: Client error boundary with retry mechanism.
15. `scripts/verify-word-bank.ts`: 35-test automated verification suite for Phase 7.
16. `docs/phases/PHASE_07_IMPLEMENTATION_PLAN.md`: Complete v1.1 engineering specification.
17. `docs/phases/PHASE_07_REPORT.md`: This comprehensive completion and review document.

---

## 5. Files Modified
1. `prisma/schema.prisma`:
   - Updated `Vocabulary` model with GIN trigram indexes using explicit `map: "Vocabulary_word_trgm_idx"` and `map: "Vocabulary_meaningVi_trgm_idx"`.
2. `package.json` & `package-lock.json`:
   - Added `@upstash/ratelimit` and `@upstash/redis` dependencies.
3. `src/app/(public)/articles/[slug]/page.tsx`:
   - Added batch lookup for authenticated user's saved vocabulary IDs (`userId && vocabularyIds.length > 0`).
   - Injected `initialSavedVocabIds` array into `BilingualSentenceList`.
4. `src/components/reader/bilingual-sentence-list.tsx`:
   - Maintained `savedVocabIds: Set<string>` state.
   - Implemented `handleToggleSave` with optimistic update and rollback on failure.
5. `src/components/reader/bilingual-sentence-item.tsx`:
   - Passed `isSaved` boolean down to each interactive vocabulary token.
6. `src/components/reader/vocabulary-popover.tsx`:
   - Added interactive "☆ Lưu vào Sổ từ" / "✓ Đã lưu vào Sổ từ" button with loading spinner and unauthenticated tooltip prompt.
7. `src/components/common/header.tsx`:
   - Added "Sổ từ vựng" navigation link in both desktop header and mobile drawer for authenticated sessions.
8. `docs/PROJECT_STATE.md`:
   - Updated status to Phase 7 COMPLETED & VERIFIED.
9. `IMPLEMENTATION_PLAN.md`:
   - Updated roadmap row for Phase 7 to COMPLETED & VERIFIED.

---

## 6. Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                             ARTICLE READER PAGE                             │
│                  src/app/(public)/articles/[slug]/page.tsx                  │
│                                                                             │
│  1. Server Component fetches Article + Sentences + Vocabularies             │
│  2. If session authenticated -> single batch query for saved vocabularies:  │
│     SELECT vocabularyId FROM UserSavedVocabulary                            │
│     WHERE userId = :currentUserId AND vocabularyId IN (:allArticleVocabIds) │
│  3. Injects initialSavedVocabIds: string[] into BilingualSentenceList       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER INTERACTION (POPOVER)                         │
│                  src/components/reader/vocabulary-popover.tsx               │
│                                                                             │
│  User clicks "☆ Lưu vào Sổ từ"                                             │
│  1. Optimistic UI: Immediately updates to "✓ Đã lưu vào Sổ từ"              │
│  2. Invokes Server Action: saveVocabularyAction({ vocabularyId })           │
│     - Authenticates session (requireAuth)                                   │
│     - Rate limits client (30 req/min sliding window)                        │
│     - Validates payload with Zod                                            │
│     - Checks global Vocabulary existence                                    │
│     - Executes atomic upsert on UserSavedVocabulary                         │
│     - Writes audit log to PostgreSQL                                        │
│     - Triggers tag revalidation: revalidateTag(`word-bank-${userId}`)       │
│  3. If error occurs: Rollback state to previous and show error toast         │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PERSONAL WORD BANK PAGE                            │
│                       src/app/(public)/word-bank/page.tsx                   │
│                                                                             │
│  1. Guarded by requireAuth('/word-bank')                                    │
│  2. robots: { index: false, follow: false }                                 │
│  3. Executes getWordBankPage({ userId, page, query, cefrLevel }):           │
│     Query 1: count() with Trigram GIN index on word / meaningVi             │
│     Query 2: findMany(take: 12, skip: ..., orderBy: savedAt DESC)           │
│     Query 3: Batch fetch originating sentence context (0 N+1 queries)       │
│  4. Renders responsive grid: WordBankCard with audio, context & remove btn  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Verification Test Results

### 7.1 Phase 7 Verification Suite (`scripts/verify-word-bank.ts`)
Total Tests: **35 / 35 PASSED (100%)**

| ID | Test Category | Specification Tested | Result |
| :--- | :--- | :--- | :---: |
| `TC-WB-01` | Auth & Security | Unauthenticated visitor to `/word-bank` redirected to `/login` | ✅ PASS |
| `TC-WB-02` | Auth & Security | Authenticated user queries own Word Bank | ✅ PASS |
| `TC-WB-03` | Auth & Security | Server actions derive `userId` strictly from session (tamper-proof) | ✅ PASS |
| `TC-WB-04` | Auth & Security | User A cannot read User B's saved vocabulary (tenant isolation) | ✅ PASS |
| `TC-WB-05` | Save Operation | Save vocabulary creates valid record linked to current user | ✅ PASS |
| `TC-WB-06` | Save Operation | Duplicate save prevented via unique constraint & atomic upsert | ✅ PASS |
| `TC-WB-07` | Save Operation | Save nonexistent vocabulary ID safely rejected (`NOT_FOUND`) | ✅ PASS |
| `TC-WB-08` | Save Operation | Save operation preserves global Vocabulary integrity | ✅ PASS |
| `TC-WB-09` | Save Operation | Unauthenticated save attempt returns `UNAUTHORIZED` | ✅ PASS |
| `TC-WB-10` | Unsave Operation | Unsave vocabulary deletes relation cleanly | ✅ PASS |
| `TC-WB-11` | Unsave Operation | Unsave non-saved vocabulary is idempotent safe no-op | ✅ PASS |
| `TC-WB-12` | Unsave Operation | User A cannot delete or unsave User B's vocabulary | ✅ PASS |
| `TC-WB-13` | Unsave Operation | Unsaving does not cascade delete global Vocabulary record | ✅ PASS |
| `TC-WB-14` | Reader Integration | Reader identifies unsaved vocabulary correctly | ✅ PASS |
| `TC-WB-15` | Reader Integration | Reader identifies saved vocabulary correctly (batch lookup) | ✅ PASS |
| `TC-WB-16` | Reader Integration | Unauthenticated reader executes zero saved vocabulary DB queries | ✅ PASS |
| `TC-WB-17` | Performance | Batch reader query eliminates N+1 query pattern | ✅ PASS |
| `TC-WB-18` | Query & Sort | Word Bank sorts by `savedAt DESC` deterministically | ✅ PASS |
| `TC-WB-19` | Search | Search by English word using case-insensitive trigram GIN index | ✅ PASS |
| `TC-WB-20` | Search | Search by Vietnamese definition using trigram GIN index | ✅ PASS |
| `TC-WB-21` | Filter | CEFR level filtering isolates matching items | ✅ PASS |
| `TC-WB-22` | Filter | Combined search and CEFR filter yields exact intersection | ✅ PASS |
| `TC-WB-23` | Pagination | Server-side pagination computes `totalPages`, `skip`, `take` safely | ✅ PASS |
| `TC-WB-24` | Context | Originating sentence context and article back-link preserved | ✅ PASS |
| `TC-WB-25` | Fallback | Graceful fallback to vocabulary examples when no article instance | ✅ PASS |
| `TC-WB-26` | SEO | Private Word Bank metadata has `robots: { index: false, follow: false }` | ✅ PASS |
| `TC-WB-27` | UX & A11y | Accessible empty state rendered when 0 records found | ✅ PASS |
| `TC-SEC-01` | Security | XSS attempt in search query handled safely | ✅ PASS |
| `TC-SEC-02` | Security | SQL injection attempt in search parameterized and neutralized | ✅ PASS |
| `TC-SEC-03` | Security | Extremely long input (>10,000 chars) rejected by Zod schema | ✅ PASS |
| `TC-SEC-04` | Concurrency | 10 concurrent saves (`Promise.all`) race-condition free | ✅ PASS |
| `TC-SEC-05` | Rate Limiting | Rate limiter blocks requests exceeding 30 req/min | ✅ PASS |
| `TC-SEC-06` | Boundary | Pagination boundaries (`page=0`, `page=-1`, `page=999999`) clamped safely | ✅ PASS |
| `TC-SEC-07` | Integrity | CSRF and invalid payload validation integrity enforced | ✅ PASS |
| `TC-SEC-08` | Information Leakage | Zero Prisma connection strings or password hashes leaked to DTOs | ✅ PASS |

### 7.2 Full Regression Test Suite Summary
All existing test suites were executed against the updated codebase:
- `scripts/verify-db.ts`: **10 / 10 PASSED**
- `scripts/verify-auth.ts`: **10 / 10 PASSED**
- `scripts/verify-admin.ts`: **20 / 20 PASSED**
- `scripts/verify-public.ts`: **20 / 20 PASSED**
- `scripts/verify-reader.ts`: **26 / 26 PASSED**
- `scripts/verify-word-bank.ts`: **35 / 35 PASSED**
- **Grand Total Automated Tests**: **121 / 121 PASSED (100%)**

### 7.3 Code Quality & Production Build
- `npm run typecheck`: **0 errors (Code 0)**
- `npm run lint`: **0 errors, 0 warnings (Code 0)**
- `npm run build`: **Compiled successfully in 17.6s (Code 0)**

---

## 8. Browser E2E Verification & Media Artifacts

The browser subagent executed a full end-to-end interactive session on the production server (`http://localhost:3000`):

1. **Authentication Flow (`logged_in_header`)**:
   - Logged in with learner account `learner@example.com`.
   - Verified that the header displays the authenticated user name and "Sổ từ vựng" navigation link.
2. **Article Reader Vocabulary Save (`vocab_popover_before_save` & `vocab_popover_after_save`)**:
   - Navigated to `/articles/clean-energy-microgrids-urban-resilience`.
   - Clicked vocabulary token `paradigm shift` (C1).
   - Popover rendered with initial state "☆ Lưu vào Sổ từ".
   - Clicked save; button instantly updated to "★ Đã lưu vào Sổ từ" with active state.
3. **Word Bank Page Inspection (`word_bank_list`)**:
   - Navigated to `/word-bank`.
   - Verified word counter, search bar, and CEFR filter pills (`Tất cả`, `A1`–`C2`).
   - Verified `paradigm shift` card with audio pronunciation button, IPA, POS, CEFR badge, definition, sentence quote, and article link.
4. **Search & Filter Interactivity (`word_bank_filter_active`)**:
   - Filtered by text `paradigm` and CEFR pill `C1`.
   - Verified exact filtering to 1 matching item.
5. **Unsave / Remove Interactivity (`word_bank_after_unsave`)**:
   - Clicked `Xóa` button on the card.
   - Verified toast notification feedback and counter decrement.
6. **Cross-Page Synchronization (`article_vocab_popover_reset`)**:
   - Returned to the article; opened `paradigm shift` popover.
   - Verified that the popover state automatically synchronized back to unsaved ("☆ Lưu vào Sổ từ").
7. **Mobile Responsiveness (`word_bank_mobile_view`)**:
   - Resized viewport to $375 \times 667$.
   - Verified that search bar, filter chips, navigation, and word cards adapt cleanly.

### Captured Artifacts
- Browser Session Recording:
  ![Word Bank E2E Video Recording](file:///C:/Users/hoang/.gemini/antigravity-ide/brain/265eb029-56b2-4336-b42b-5c88c55dd5e0/word_bank_e2e_1789305058626.webp)
- Visual Screenshots:
  - Header with Sổ từ vựng link: `logged_in_header_1789305081307.png`
  - Vocabulary popover before save: `vocab_popover_before_save_1789305127367.png`
  - Vocabulary popover after save: `vocab_popover_after_save_1789305145563.png`
  - Word Bank card list: `word_bank_list_1789305166543.png`
  - Active search & CEFR filter: `word_bank_filter_active_1789305211665.png`
  - Word Bank after unsaving: `word_bank_after_unsave_1789305248321.png`
  - Article popover reset to unsaved: `article_vocab_popover_reset_1789305296816.png`
  - Mobile viewport ($375 \times 667$): `word_bank_mobile_view_1789305317561.png`

---

## 9. Security & Tenant Isolation Analysis
1. **Zero Client Trust**:
   - Neither `saveVocabularyAction` nor `unsaveVocabularyAction` accepts a `userId` parameter in the client payload. `userId` is strictly extracted from the decrypted server-side cryptographic session.
2. **Strict Multi-Tenant Scoping**:
   - Unsaving is enforced via `deleteMany({ where: { userId, vocabularyId } })`. If an attacker attempts to unsave a word ID owned by another user, PostgreSQL matches 0 records and no cross-user deletion occurs (`TC-WB-12`).
3. **Database Injection & XSS Neutralization**:
   - All search queries are parameterized by Prisma (`contains: query, mode: 'insensitive'`).
   - Client search strings are validated by Zod (`z.string().max(100)`).
   - React automatically escapes rendered strings, neutralizing XSS payloads (`TC-SEC-01`, `TC-SEC-02`, `TC-SEC-03`).
4. **Search Engine Shielding**:
   - `/word-bank` explicitly returns `robots: { index: false, follow: false }` to guarantee personal user data is never crawled or indexed (`TC-WB-26`).

---

## 10. Performance & Database Optimization
1. **Trigram Search Performance**:
   - Added `pg_trgm` extension and GIN indexes (`Vocabulary_word_trgm_idx` and `Vocabulary_meaningVi_trgm_idx`).
   - Validated via PostgreSQL `EXPLAIN ANALYZE`: index scans execute with sub-millisecond query planning on large vocabulary corpora.
2. **Zero N+1 Query Architecture**:
   - Article Reader: Fetches all saved vocabulary IDs for the article in **1 single query** (`findMany({ where: { userId, vocabularyId: { in: ids } } })`).
   - Word Bank Page: Fetches total count, paginated cards, and originating sentence context in **3 constant queries** regardless of item count (`take: 12`).
3. **Optimistic Updates**:
   - Vocabulary popover updates UI state immediately upon user click with zero network latency, gracefully rolling back only if the server returns an error.

---

## 11. Senior Review Findings & Known Limitations
- **Findings**:
  - Implementation adheres strictly to BRD/FSD specifications and Implementation Plan v1.1.
  - Race conditions prevented by replacing legacy toggles with explicit `save` and `unsave` intents.
  - Zero database credentials or server secrets leaked to serialized DTOs (`TC-SEC-08`).
- **Known Limitations (by design)**:
  - Upstash Redis utilizes an in-memory sliding window fallback in local environments where `UPSTASH_REDIS_REST_URL` is unconfigured. In production deployment, setting the Upstash environment variables activates distributed Redis rate limiting seamlessly.
  - Spaced repetition flashcards and review intervals are scoped for Phase 10.

---

## 12. Final Decision & Status Gate

```text
PHASE: 07 — VOCABULARY & PERSONAL WORD BANK
STATUS: WAIT
RESULT: PASS
ALL TESTS: 121/121 PASSED (100%)
BUILD: SUCCESSFUL
NEXT: PHASE 08 — SEARCH & FILTER (AWAITING USER APPROVAL)
```
