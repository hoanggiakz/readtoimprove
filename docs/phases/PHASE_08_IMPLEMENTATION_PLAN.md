# PHASE 08 — IMPLEMENTATION PLAN: SEARCH & FILTER (GLOBAL DISCOVERY)

## 1. Objective
Build a fast, resilient, and accessible bilingual discovery engine for ReadToImprove. The system will empower English learners (CEFR B1–C2) to search authentic articles across English and Vietnamese titles, excerpts, and vocabulary contexts with sub-200ms p95 latency. It combines hybrid PostgreSQL full-text search (`tsvector` + GIN) with trigram matching (`pg_trgm`), real-time debounced autocomplete suggestions, multi-dimensional faceted filtering (Category + CEFR + Query), URL state synchronization for shareable links, and accessible zero-result recovery states.

---

## 2. Requirements Mapping

| Requirement | Proposed FR-ID | BRD/FSD Source | Description |
| :--- | :--- | :--- | :--- |
| **Global Article Search** | `FR-SEARCH-01` | Section 4.3 (Discovery) | Full-text keyword search across English & Vietnamese article titles, excerpts, and content |
| **Bilingual Relevance Ranking**| `FR-SEARCH-02` | Section 4.3 (Discovery) | Ranked search results using weighted relevance (`titleEn` weight A, `excerptEn` weight B) and recency |
| **Debounced Autocomplete** | `FR-SEARCH-03` | Master Prompt v2 (Sec 22)| Fast live suggestions dropdown (< 100ms) with title, category chip, and CEFR level badge |
| **Category Facet Filtering** | `FR-SEARCH-04` | Section 4.1 & 4.3 (Catalog) | Filter articles by single category slug with dynamic article counts |
| **CEFR Level Facet Filtering**| `FR-SEARCH-05` | Section 2 & 4.3 (Catalog) | Filter articles by European CEFR proficiency level (`A1` to `C2` + `ALL`) |
| **Combined Faceted Query** | `FR-SEARCH-06` | Master Prompt v2 (Sec 22)| Intersection filtering (`q` + `category` + `level` + `page`) with authoritative public visibility |
| **URL State Synchronization** | `FR-SEARCH-07` | Master Prompt v2 (Sec 22)| Two-way synchronization between URL `searchParams` and UI controls; shareable and history-enabled |
| **Search Result Highlighting**| `FR-SEARCH-08` | Master Prompt v2 (Sec 22)| Safe keyword highlight markup in titles and excerpts without `dangerouslySetInnerHTML` |

---

## 3. Architecture Decision

### 3.1 Full-Text Search Engine Comparison

| Criteria | Option A: Native `tsvector` + GIN | Option B: Trigram `pg_trgm` GIN (Phase 7) | Option C: Hybrid `tsvector` + `pg_trgm` (Recommended) | Option D: External (Meilisearch / ES) |
| :--- | :--- | :--- | :--- | :--- |
| **English Stemming** | High (native `english` dict: "sustain" $\leftrightarrow$ "sustainable") | None (pure character n-gram) | **High** (stemmed English + trigram backup) | High |
| **Vietnamese Search** | Poor (no native VN stemmer in standard PG) | **Excellent** (accent/case-insensitive substring) | **Excellent** (trigram covers Vietnamese titles/excerpts) | Excellent |
| **Typo / Substring** | Moderate (prefix only: `word:*`) | **Excellent** (matches partial & substring) | **Excellent** (stemmed + partial fallback) | Excellent |
| **Latency (p95)** | < 15ms | < 25ms | **< 20ms** | < 10ms |
| **Operational Cost** | $0 (In-database PostgreSQL 16) | $0 (In-database PostgreSQL 16) | **$0 (Zero extra infrastructure)** | High ($$$ cluster, sync daemon) |
| **Architecture Fit** | High | High | **Optimal for Bilingual App** | Over-engineering for < 10,000 articles |

**Decision**: **Option C: Hybrid PostgreSQL Search Architecture**.
- **English**: Uses generated `searchVector` (`tsvector`) indexed with GIN, weighted with `'A'` for `titleEn` and `'B'` for `excerptEn`.
- **Vietnamese & Substrings**: Leverages `pg_trgm` GIN indexes on `titleVi`, `excerptVi`, and `titleEn` (already enabled in Phase 7).
- **Justification**: English learners search both in English and Vietnamese keywords (e.g. searching "bền vững" or "sustainable" or "microgrid"). Pure `tsvector` fails on Vietnamese without specialized C extensions, while pure trigram lacks English lexical stemming. Hybrid achieves both without external daemons.

### 3.2 Threshold for Migrating to External Search (Meilisearch / Elasticsearch)
An external search engine is **not justified** at the current scale. Migration will be triggered **only when both criteria are met**:
1. **Catalog Scale**: Article count exceeds **10,000 published articles** AND sentence count exceeds **150,000 sentences**.
2. **Measured Performance Degradation**: Search query latency p95 exceeds **200ms for 7 consecutive days** under production load as recorded in server metrics.

### 3.3 Autocomplete Strategy
- **Trigger**: Minimum 2 characters, debounced at **300ms** on the client.
- **Query**: Targeted query returning top 5 most relevant articles + matching category count:
  - Selects `id`, `slug`, `titleEn`, `titleVi`, `cefrLevel`, `readingTimeMinutes`, and primary category.
  - Excludes sentence body to keep payload < 2KB.
- **Cache**: Cached at edge/server with 60-second TTL via `unstable_cache` keyed by normalized query.

### 3.4 URL State Strategy
- **Single Source of Truth**: Next.js App Router `searchParams` (`?q=...&category=...&level=...&page=...`).
- **Mechanism**: Client search bar and filter pills update URL using `useRouter.push(url, { scroll: false })` wrapped in `useTransition`.
- **Benefits**:
  - 100% shareable URLs (e.g., copying `/articles?q=energy&level=B2` renders identical state for any recipient).
  - Native browser back/forward button support without state desynchronization.
  - Server Component reads params directly during SSR, providing zero-JS HTML search crawlers can index.

### 3.5 Pagination Strategy
- **Offset-based Pagination (`page` & `pageSize = 12`)**:
  - Capped at `pageSize = 50` max to prevent buffer allocation abuse.
  - Total count returned alongside results to display "Trang X / Y" and "Hiển thị Z bài viết".
  - Why not Cursor-based? Public article catalogs require numbered page navigation and total result count indicators. Offset pagination on indexed columns (`status, publishedAt, id`) performs in < 10ms for datasets under 100,000 rows.

### 3.6 API Contract Strategy
- **Incremental OpenAPI Adoption**: Phase 8 initializes `docs/api/openapi.yaml` documenting the public search and autocomplete endpoints.
- **Scope**: Dedicated strictly to Search & Filter routes (`/api/search`, `/api/search/suggestions`).
- **Format**: OpenAPI 3.1.0 specification with complete Zod-aligned schemas, query parameters, 200 OK responses, and 400/429/500 error envelopes.
- **Deviation Documentation**: `docs/api/README.md` will document the incremental backfill plan for earlier phases (Auth, CMS, Word Bank).

---

## 4. Database Changes

### 4.1 Migration Design
To support weighted English full-text search alongside trigram matching, we add a generated `tsvector` column and GIN index to `Article`.

```sql
-- Migration: 20260914140000_add_article_full_text_search
-- Step 1: Ensure pg_trgm is active (already enabled in Phase 7)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Step 2: Add generated searchVector column on Article
ALTER TABLE "Article" 
ADD COLUMN IF NOT EXISTS "searchVector" tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce("titleEn", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("excerptEn", '')), 'B') ||
  setweight(to_tsvector('simple', coalesce("sourceName", '')), 'C')
) STORED;

-- Step 3: Create GIN index on searchVector
CREATE INDEX IF NOT EXISTS "Article_searchVector_idx" 
ON "Article" USING GIN ("searchVector");

-- Step 4: Create GIN Trigram indexes on titleEn and titleVi for substring & Vietnamese search
CREATE INDEX IF NOT EXISTS "Article_titleEn_trgm_idx" 
ON "Article" USING GIN ("titleEn" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Article_titleVi_trgm_idx" 
ON "Article" USING GIN ("titleVi" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Article_excerptVi_trgm_idx" 
ON "Article" USING GIN ("excerptVi" gin_trgm_ops);
```

### 4.2 Rollback SQL
```sql
DROP INDEX IF EXISTS "Article_excerptVi_trgm_idx";
DROP INDEX IF EXISTS "Article_titleVi_trgm_idx";
DROP INDEX IF EXISTS "Article_titleEn_trgm_idx";
DROP INDEX IF EXISTS "Article_searchVector_idx";
ALTER TABLE "Article" DROP COLUMN IF EXISTS "searchVector";
```

### 4.3 Write Performance Impact
- `searchVector` is generated on write (`INSERT` / `UPDATE`).
- Cost: ~1.2ms extra CPU time per article mutation. Because articles are created/updated exclusively by admins in Phase 4 CMS (low write volume: ~10 articles/day), write impact is negligible (0.01% of DB capacity).

---

## 5. Search Query Design

### 5.1 Hybrid Search Query Logic
```sql
-- Conceptual Prisma Raw / Relational Hybrid
WHERE "status" = 'PUBLISHED' 
  AND "publishedAt" IS NOT NULL 
  AND "publishedAt" <= NOW()
  AND (
    -- Full-text English match with stemming
    "searchVector" @@ websearch_to_tsquery('english', :query)
    -- OR Vietnamese title/excerpt trigram match
    OR "titleVi" ILIKE :wildcardPattern
    OR "excerptVi" ILIKE :wildcardPattern
    -- OR English substring trigram match
    OR "titleEn" ILIKE :wildcardPattern
  )
  AND (:categorySlug IS NULL OR "id" IN (
    SELECT "articleId" FROM "ArticleCategory" ac 
    JOIN "Category" c ON ac."categoryId" = c."id" 
    WHERE c."slug" = :categorySlug
  ))
  AND (:cefrLevel IS NULL OR "cefrLevel" = :cefrLevel::"CefrLevel")
ORDER BY 
  -- Relevance score combined with recency
  (ts_rank_cd("searchVector", websearch_to_tsquery('english', :query)) * 2.0 
   + CASE WHEN "titleEn" ILIKE :wildcardPattern THEN 1.5 ELSE 0 END
   + CASE WHEN "titleVi" ILIKE :wildcardPattern THEN 1.5 ELSE 0 END) DESC,
  "publishedAt" DESC
LIMIT :limit OFFSET :offset;
```

### 5.2 Performance Targets
- Cold start query: < 50ms.
- Warm cache / indexed scan: < 15ms.
- Target p95 latency under 100 concurrent requests: < 120ms.

---

## 6. API Contract

### 6.1 Route Handlers
1. `GET /api/search`: Public search endpoint returning paginated articles and facet metadata.
2. `GET /api/search/suggestions`: Fast autocomplete suggestion endpoint returning top 5 matches.

### 6.2 Zod Schemas (`src/validations/search.ts`)
```typescript
export const searchParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(50).regex(/^[a-z0-9-]*$/).optional(),
  level: z.nativeEnum(CefrLevel).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const suggestionsQuerySchema = z.object({
  q: z.string().trim().min(2, "Minimum 2 characters").max(100),
});
```

### 6.3 Error Envelopes
- `400 Bad Request`: Validation error with detailed Zod field issues.
- `429 Too Many Requests`: Rate limit exceeded (standard `Retry-After` header).
- `500 Internal Server Error`: Masked internal error message with audit logging.

---

## 7. UI/UX Design & Components

### 7.1 Search Surface Integration
1. **Header Search Bar**:
   - Desktop: Search input with shortcut hint (`Ctrl+K` / `⌘K`) opening the interactive Search Command Dialog.
   - Mobile: Search icon button toggling full-width search bar in drawer.
2. **Articles Catalog Page (`/articles`)**:
   - Inline Search Bar with real-time clear button and autocomplete dropdown.
   - Horizontal Category Pills with active state and count badge.
   - CEFR Level Filter Pills (`Tất cả`, `B1`, `B2`, `C1`, `C2`).
   - Active filters summary bar with "Xóa tất cả bộ lọc" (Reset) button.

### 7.2 Autocomplete Dropdown
- Triggers after 2 characters typed, 300ms debounce.
- Shows:
  - Matching article title (with matched term bolded).
  - CEFR difficulty badge (e.g. `B2`).
  - Primary category tag.
  - Keyboard navigation hint (`↑` `↓` to navigate, `Enter` to select, `Esc` to dismiss).

### 7.3 Safe Result Highlighting
- Custom component `SearchHighlight`: Splits text into segments using regex matching and wraps matched tokens in `<mark className="bg-primary/20 text-primary font-medium rounded px-0.5">`.
- **Zero `dangerouslySetInnerHTML`**: 100% immune to XSS injection.

### 7.4 Accessible Empty States
- **Zero Results (`q` found nothing)**: Displays friendly prompt with suggestions (e.g., "Kiểm tra lỗi chính tả", "Thử từ khóa ngắn hơn", "Chọn cấp độ CEFR khác") and a reset button.
- **Empty Category/CEFR**: Shows direct links to explore other categories.

---

## 8. Performance & Rate Limiting Strategy
- **Client Debouncing**: 300ms debounce via custom hook `useDebounce`.
- **Rate Limiting**:
  - `/api/search`: 60 requests / minute per IP via Upstash Redis sliding window.
  - `/api/search/suggestions`: 120 requests / minute per IP.
- **Prisma Prepared Statements**: Parameterized SQL queries ensure plan caching in PostgreSQL.
- **Client Bundle**: Pure React + Radix UI primitives. Zero heavy search bundle additions (< 8KB gzip total).

---

## 9. Security
1. **Input Sanitization**: Length restricted to 100 characters; control characters stripped.
2. **XSS Immunity**: Search term echoing in titles, headings, and breadcrumbs is sanitized and rendered via standard React JSX text nodes and safe token slicing.
3. **SQL Injection**: Handled entirely through Prisma Client parameterized calls and `Prisma.sql` template tags.
4. **Public Article Isolation**: Authoritative visibility guard (`status === PUBLISHED && publishedAt <= now`) strictly applied in all search and suggestion queries. Draft and archived articles are 100% invisible.

---

## 10. Comprehensive Verification Suite (`scripts/verify-search.ts`)
Minimum **32 automated tests**:
- `TC-SEARCH-01`: Full-text English search returns published article matching keyword.
- `TC-SEARCH-02`: Full-text English search handles stemming (e.g. "sustainable" matches "sustainability").
- `TC-SEARCH-03`: Vietnamese title trigram search returns correct article.
- `TC-SEARCH-04`: Vietnamese excerpt trigram search matches definition text.
- `TC-SEARCH-05`: Case-insensitive search parity ("ENERGY" === "energy").
- `TC-SEARCH-06`: Category filter isolates only articles in specified category.
- `TC-SEARCH-07`: CEFR filter isolates only articles matching target level.
- `TC-SEARCH-08`: Combined search (`q` + `category` + `level`) produces exact intersection.
- `TC-SEARCH-09`: Draft, pending, archived, and future articles strictly excluded.
- `TC-SEARCH-10`: Autocomplete suggestions endpoint returns top 5 matches with category & CEFR metadata.
- `TC-SEARCH-11`: Autocomplete suggestions query < 2 characters safely rejected.
- `TC-SEARCH-12`: Relevance ranking places title matches above excerpt-only matches.
- `TC-SEARCH-13`: Pagination `page=1` and `page=2` returns distinct non-overlapping sets.
- `TC-SEARCH-14`: Out-of-bounds pagination (`page=9999`) returns empty array without throwing.
- `TC-SEARCH-15`: Negative or zero page number normalized safely to page 1.
- `TC-SEARCH-16`: Empty search results returns `totalCount: 0` and empty array.
- `TC-SEARCH-17`: Punctuation and special search characters (`&`, `|`, `!`, `'`) sanitized safely.
- `TC-SEARCH-18`: Search highlight utility splits and marks text cleanly without HTML injection.
- `TC-SEARCH-19`: Public API route `/api/search` returns valid JSON matching OpenAPI schema.
- `TC-SEARCH-20`: Public API route `/api/search/suggestions` returns valid JSON matching schema.
- `TC-SEARCH-21`: URL state sync contract produces valid query string matching search state.
- `TC-SEARCH-22`: Exclude ID option (spotlight exclusion) functions properly.
- `TC-SEARCH-23`: Trigram index scan verified via EXPLAIN ANALYZE on Article table.
- `TC-SEARCH-24`: `searchVector` index scan verified via EXPLAIN ANALYZE on English query.
- `TC-SEC-01`: XSS injection attempt in `q` safely sanitized and neutralized.
- `TC-SEC-02`: SQL injection payload in `q` safely parameterized by Prisma.
- `TC-SEC-03`: Oversized query string (> 10,000 characters) rejected with 400 Bad Request.
- `TC-SEC-04`: Rate limiting on `/api/search` blocks requests beyond 60 req/min.
- `TC-SEC-05`: Rate limiting on `/api/search/suggestions` blocks requests beyond 120 req/min.
- `TC-SEC-06`: Invalid CEFR enum value in query params normalized safely.
- `TC-SEC-07`: Invalid category slug in query params handled gracefully (0 results, no 500 error).
- `TC-SEC-08`: Zero database credentials, internal IDs, or user session data leaked in search DTOs.

---

## 11. Full Regression Plan
1. `scripts/verify-db.ts` (10 tests)
2. `scripts/verify-auth.ts` (10 tests)
3. `scripts/verify-admin.ts` (20 tests)
4. `scripts/verify-public.ts` (20 tests)
5. `scripts/verify-reader.ts` (26 tests)
6. `scripts/verify-word-bank.ts` (35 tests)
7. `scripts/verify-search.ts` (32 tests)
- **Total Verification**: **153 / 153 Tests**.
- Code quality checks: `npm run typecheck`, `npm run lint`, `npm run build`.

---

## 12. Files to Create & Modify

### Files to Create:
1. `prisma/migrations/20260914140000_add_article_full_text_search/migration.sql` [NEW]
2. `docs/api/openapi.yaml` [NEW] — OpenAPI 3.1 contract covering `/api/search` and `/api/search/suggestions`.
3. `docs/api/README.md` [NEW] — API documentation, versioning, and incremental backfill plan.
4. `src/validations/search.ts` [NEW] — Zod validation schemas for search and suggestions.
5. `src/lib/search.ts` [NEW] — Core search service, ranking algorithms, and hybrid query builders.
6. `src/app/api/search/route.ts` [NEW] — Route Handler for `/api/search`.
7. `src/app/api/search/suggestions/route.ts` [NEW] — Route Handler for `/api/search/suggestions`.
8. `src/components/search/search-command-dialog.tsx` [NEW] — Global `Ctrl+K` command dialog with live suggestions.
9. `src/components/search/search-highlight.tsx` [NEW] — Safe text token highlighter component.
10. `scripts/verify-search.ts` [NEW] — 32-test automated verification suite.
11. `docs/phases/PHASE_08_IMPLEMENTATION_PLAN.md` [NEW] — Finalized approved implementation plan.
12. `docs/phases/PHASE_08_REPORT.md` [NEW] — Comprehensive completion report.

### Files to Modify:
1. `prisma/schema.prisma` [MODIFY] — Add `searchVector` unsupported column and GIN index annotations.
2. `src/lib/articles.ts` [MODIFY] — Upgrade `getPublicArticles` to use hybrid full-text/trigram search engine.
3. `src/components/common/header.tsx` [MODIFY] — Integrate interactive Search Command button (`Ctrl+K`).
4. `src/components/public/search-bar.tsx` [MODIFY] — Upgrade with debounced autocomplete and keyboard navigation.
5. `src/app/(public)/articles/page.tsx` [MODIFY] — Integrate search result highlighting and enriched empty state.
6. `docs/PROJECT_STATE.md` [MODIFY] — Update phase status, ADRs (OpenAPI deferral, Phase 0 naming deviation).
7. `IMPLEMENTATION_PLAN.md` [MODIFY] — Update roadmap status.

---

## 13. Dependencies
- **New npm packages**: **NONE (0 packages)**.
- Standard Next.js 15 App Router, React 19, Lucide icons, `@upstash/ratelimit`, and PostgreSQL 16 provide all required primitives.

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
| :--- | :--- | :--- | :--- |
| **Prisma schema limitation on `tsvector`** | Medium | Medium | Define `searchVector Unsupported("tsvector")?` in schema and use SQL migration for generated column |
| **Trigram search performance with leading wildcard** | Low | Low | GIN index on `titleEn`, `titleVi`, `excerptVi` supports `ILIKE '%query%'` natively with index scan |
| **URL sync race condition during fast typing** | Low | Low | Debounce input 300ms + wrap `router.push` in `React.useTransition` |
| **Scraping / query DoS** | Medium | Low | Upstash Redis rate limiting (60 req/min) + query length cap (100 chars) |

---

## 15. Rollback Plan
- **Git checkpoint**: `git tag phase-08-start`.
- **Database rollback**: Execute rollback script dropping `searchVector` and GIN indexes.
- **Application rollback**: `git reset --hard phase-08-start`.

---

## 16. Definition of Done
- [ ] All 8 Functional Requirements (`FR-SEARCH-01` to `FR-SEARCH-08`) mapped and implemented.
- [ ] Database migration deployed and rollback tested.
- [ ] PostgreSQL `EXPLAIN ANALYZE` verifies index scan on `searchVector` and trigram indexes.
- [ ] Search query latency p95 < 200ms.
- [ ] Minimum 32 automated tests in `scripts/verify-search.ts` pass (100%).
- [ ] Full regression suite passes 100% (153 total tests).
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with 0 errors (raw output captured).
- [ ] Interactive browser E2E test passes with recording and screenshots saved in `docs/phases/phase-08/evidence/`.
- [ ] `docs/api/openapi.yaml` created with Phase 8 search endpoints.
- [ ] `docs/api/README.md` created documenting API strategy.
- [ ] ADR documenting OpenAPI incremental strategy added to `PROJECT_STATE.md`.
- [ ] ADR documenting `phase-00` documentation naming deviation added to `PROJECT_STATE.md`.
- [ ] `docs/phases/PHASE_08_REPORT.md` generated with full audit details.

---

## 17. Ambiguities & Open Questions for User Approval

1. **Global Search Dialog (`Ctrl+K` / `⌘K`) in Header**:
   - *Option A (Approved)*: Add a prominent global search trigger button in the desktop header that opens a floating Command Dialog (Cmd+K) with live suggestions and direct article navigation.
2. **Vietnamese Stemming vs Trigram**:
   - *Option A (Approved)*: Hybrid approach combining English `tsvector` with PostgreSQL `pg_trgm` GIN indexes for Vietnamese and partial substring matching. Zero external extensions needed.
3. **Autocomplete Item Actions**:
   - *Option A (Approved)*: Clicking a suggestion in autocomplete navigates directly to the article reader (`/articles/[slug]`). Pressing Enter in the input submits a full catalog search (`/articles?q=...`).
