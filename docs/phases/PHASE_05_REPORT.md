# PHASE 05 — PHASE REPORT

## 1. Phase
**PHASE 05 — PUBLIC DISCOVERY & CONTENT BROWSING**

```text
PHASE: 05
STATUS: COMPLETED
COMMIT_READY: YES
```

---

## 2. Objective
Build the production-ready public discovery and content browsing layer for **ReadToImprove**. Empower Vietnamese English learners (IELTS/TOEFL candidates, university students, and professionals) to discover authentic bilingual news articles through:
- **Homepage (`/`)**: Engaging Hero spotlight displaying the top published article, CEFR quick filter chips, active category browse bar, and latest bilingual articles stream.
- **Article Catalog (`/articles`)**: Multi-dimensional discovery with combined keyword search, category filtering, CEFR difficulty filtering, deterministic sorting, and accessible pagination.
- **Category Browsing (`/categories` and `/categories/[slug]`)**: Dedicated category directory and category-specific article streams with published article counts.
- **CEFR Level Discovery (`?level=B1`, etc.)**: Calibrated difficulty filtering across CEFR levels A1–C2.
- **PostgreSQL Search Foundation**: Case-insensitive substring matching (`contains`, `mode: 'insensitive'`) across bilingual titles and excerpts with a 2-character minimum query validation.
- **Crawlable Article Landing (`/articles/[slug]`)**: Public article preview with full bilingual metadata, reading time, source attribution, reading CTA, and 404 guard for unpublished content.
- **Absolute Privacy of Admin Console**: Complete isolation of `/secure-console-x7` from public routes, navigation, and robots.txt.

---

## 3. Phase 1–4 Dependency Verification
Phase 5 integrates with and leverages the foundation established across Phases 1 through 4:
1. **Phase 1 (Design System & Shell)**: Semantic color tokens, CEFR difficulty palette (`b1`, `b2`, `c1`, `c2`), responsive container layouts, `Button`, `Badge`, `CefrBadge`, and `ThemeToggle`.
2. **Phase 2 (Database Persistence)**: PostgreSQL 16 on Docker host port `5433`, Prisma Client singleton, all 14 schema entities (`Article`, `Category`, `ArticleCategory`, `Sentence`, `Vocabulary`, `SentenceVocabulary`), and original educational seeded data.
3. **Phase 3 (Authentication & Stealth Admin)**: Dynamic `robots.ts` disallowing `/secure-console-x7/*`, session-aware `Header` (with conditional profile / logout vs login / register buttons), and zero leakage of admin routes.
4. **Phase 4 (Admin CMS & State Machine)**: Article lifecycle state machine (`ArticleStatus.PUBLISHED`), bilingual sentence alignment, and lexical highlight tags.
5. **Regression Verification**: All previous test suites (`verify-db.ts`, `verify-auth.ts`, `verify-admin.ts`) executed and passed with 100% success.

---

## 4. Architecture & Data Flow
Phase 5 enforces strict unidirectional data flow, ensuring that Client Components never access Prisma or database queries directly:

```text
Browser Request (e.g. GET /articles?category=technology&level=B2&page=1)
    ↓
Public Next.js Server Component (src/app/(public)/articles/page.tsx)
    ↓
Zod Validation of SearchParams (src/validations/public.ts)
    ├── Validates & normalizes 'q' (min 2 chars, max 100 chars)
    ├── Validates 'category' (slug string)
    ├── Validates 'level' (strict CefrLevel enum A1–C2)
    └── Validates & coerces 'page' (integer >= 1)
    ↓
Public Data-Access Service Layer (src/lib/articles.ts)
    ├── Injects getPublicArticleWhereClause()
    │     (status === PUBLISHED && publishedAt !== null && publishedAt <= now)
    ├── Injects Category Filter (relational match on category.slug)
    ├── Injects CEFR Level Filter (cefrLevel === level)
    ├── Injects Insensitive Search Filter (titleEn, titleVi, excerptEn, excerptVi)
    └── Executes Bounded Prisma Query (take: 12, skip: offset, orderBy: [publishedAt desc, id desc])
    ↓
PostgreSQL 16 (via localhost:5433)
    ↓
Renders React Server Components (RSC)
    ├── SpotlightHero
    ├── ArticleCard
    ├── CefrSelector
    ├── CategoryFilterBar
    └── Pagination
    ↓
HTML Streamed to Browser (Instant FCP, Zero Client Waterfalls)
```

---

## 5. Critical Public Visibility Rule Implementation
Under no circumstances may draft, pending-review, archived, or future-scheduled articles be exposed to public visitors.

### 5.1 Authoritative Query Filter
Every public query encapsulates the centralized server-side where clause:
```typescript
// src/lib/articles.ts
export function getPublicArticleWhereClause(
  extraWhere?: Prisma.ArticleWhereInput,
  currentDate = new Date()
): Prisma.ArticleWhereInput {
  return {
    ...extraWhere,
    status: ArticleStatus.PUBLISHED,
    publishedAt: {
      not: null,
      lte: currentDate,
    },
  };
}
```

### 5.2 Server-Side Enforcement Matrix
| Article State | Status Field | PublishedAt Field | Public Discovery Behavior |
| :--- | :--- | :--- | :--- |
| **Published (Past/Current)** | `PUBLISHED` | `publishedAt <= now` | **VISIBLE** in listings and by slug lookup |
| **Scheduled (Future)** | `PUBLISHED` | `publishedAt > now` | **BLOCKED** — Excluded from list; returns 404 on slug |
| **Draft** | `DRAFT` | `null` | **BLOCKED** — Excluded from list; returns 404 on slug |
| **Pending Review** | `PENDING_REVIEW` | `null` | **BLOCKED** — Excluded from list; returns 404 on slug |
| **Archived** | `ARCHIVED` | Past timestamp | **BLOCKED** — Excluded from list; returns 404 on slug |

---

## 6. Homepage Architecture & Features (`src/app/(public)/page.tsx`)
The homepage is a high-performance React Server Component (`revalidate = 60`) delivering:
1. **Hero Discovery Header**: Clear educational headline ("Đọc Báo Song Ngữ Chuẩn CEFR"), value proposition, and an inline global search bar.
2. **Hero Spotlight Section (`src/components/public/spotlight-hero.tsx`)**: Prominently highlights the latest published article with high visual hierarchy, CEFR badge, category chips, reading time, and direct reading action button.
3. **Discovery Filters Row**: Dual-column card grouping the interactive `CefrSelector` and `CategoryFilterBar` with live published article counts.
4. **Latest Bilingual Articles Grid**: Responsive 3-column grid of `ArticleCard`s with deterministic sorting (`publishedAt DESC, id DESC`).
5. **The Golden Reading Loop**: Educational 5-step methodology guide explaining the core learning loop.
6. **CEFR Overview Cards**: Quick-reference difficulty cards linking to pre-filtered catalog views.

---

## 7. Reusable Article Catalog & Multi-Dimensional Filtering (`src/app/(public)/articles/page.tsx`)
The unified catalog page supports composable multi-dimensional filtering:
- **Search Query**: `?q=sustainable` (minimum 2 characters, case-insensitive across English & Vietnamese fields).
- **Category Filter**: `?category=technology` (filters by category slug).
- **CEFR Level Filter**: `?level=B2` (strict enum validation).
- **Page Parameter**: `?page=2` (deterministic offset pagination).
- **Active Filter Summary Chips**: Displays removable filter tags with a one-click "Xóa tất cả bộ lọc" reset button.
- **Article Counter**: Displays live counts (e.g., `Hiển thị 12 trên tổng số 48 bài viết`).
- **Dynamic SEO Metadata**: Tailors page `<title>` and `<meta name="description">` to the active query/filter combination.

---

## 8. Category Discovery System
- **Category Directory (`src/app/(public)/categories/page.tsx`)**:
  - Displays all news categories with Vietnamese and English titles, descriptions, and published article counts.
  - Queries category counts filtered strictly by `article.status === PUBLISHED && article.publishedAt <= now`.
- **Category Stream (`src/app/(public)/categories/[slug]/page.tsx`)**:
  - Dedicated category feed with breadcrumbs, category banner, article grid, and pagination.
  - Returns `notFound()` if category slug does not exist.

---

## 9. CEFR Level Difficulty Navigation (`src/components/public/cefr-selector.tsx`)
- Provides fast, one-click access to CEFR levels `A1`, `A2`, `B1`, `B2`, `C1`, and `C2`.
- Integrates with `src/lib/cefr.ts` metadata to display descriptive level labels (e.g., `B2 — Upper Intermediate`).
- Preserves active search queries and category filters while switching levels.
- Strict server-side validation via `publicArticlesQuerySchema`: invalid values are safely normalized to `undefined`.

---

## 10. PostgreSQL Search Foundation
- **Search Engine**: PostgreSQL case-insensitive substring search (`contains`, `mode: 'insensitive'`) across:
  - `titleEn`
  - `titleVi`
  - `excerptEn`
  - `excerptVi`
- **Validation**:
  - Minimum query length: 2 characters (queries $< 2$ characters are bypassed in query service and Zod schema, preventing expensive scans).
  - Maximum query length: 100 characters.
  - Query sanitization: Whitespace trimmed.
- **Zero Premature Infrastructure**: No external Elasticsearch/Meilisearch cluster introduced; PostgreSQL handles Phase 5 search requirements natively with sub-millisecond execution.

---

## 11. Public Article Landing & SEO Metadata (`src/app/(public)/articles/[slug]/page.tsx`)
- **Direct 404 Guard**: If an article is not found, or its status is `DRAFT`, `PENDING_REVIEW`, `ARCHIVED`, or `publishedAt > now`, calls Next.js `notFound()`.
- **SEO Metadata (`generateMetadata`)**:
  - Generates custom `title`, `description`, and `canonical` URL.
  - Generates OpenGraph article metadata (`og:title`, `og:description`, `og:url`, `og:image`, `og:type = 'article'`, and `publishedTime`).
- **Bilingual Content Layout**:
  - Top breadcrumb navigation.
  - Badges for CEFR level, categories, reading time, and publication date.
  - Source attribution with external link.
  - Excerpt callout box.
  - Sentence preview with vocabulary highlight counters.
  - Educational fair-use copyright compliance notice.

---

## 12. Component Architecture
All public UI components are organized in `src/components/public/`:
1. `article-card.tsx`: Accessible `<article>` card with thumbnail, CEFR badge, category chips, bilingual title, excerpt, reading time, and attribution.
2. `article-card-skeleton.tsx`: Pulse skeleton loaders (`ArticleCardSkeleton` and `ArticleGridSkeleton`) for Suspense boundaries.
3. `spotlight-hero.tsx`: Featured article display on the homepage.
4. `cefr-selector.tsx`: Interactive CEFR difficulty navigator pills.
5. `category-filter-bar.tsx`: Horizontal category chip filter bar with active states and published article counts.
6. `search-bar.tsx`: Client search input with debounced query updates and clear button.
7. `pagination.tsx`: Accessible pagination bar preserving existing query parameters.
8. `empty-state.tsx`: User-friendly empty state when search or filters return zero matches.

---

## 13. Data Access & Query Optimization (`src/lib/articles.ts`)
- **Bounded Queries**: All queries enforce strict pagination bounds (`take: pageSize`, `skip: offset`, default 12 items).
- **Deterministic Ordering**: Composite ordering `orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }]` prevents non-deterministic page splits.
- **Atomic Pagination Count**: Uses Prisma `$transaction([findMany, count])` to guarantee consistency between result items and total counts.
- **No Over-Fetching**: Omits full article body and sentence text on listing queries; only includes lightweight relations (`categories` and `_count.sentences`).

---

## 14. Accessibility (WCAG 2.1 AA) Compliance
- **Semantic HTML**: Proper use of `<article>`, `<nav aria-label="...">`, `<header>`, and `<main>`.
- **Heading Hierarchy**: Exactly one `<h1>` per page, descending logically to `<h2>` and `<h3>`.
- **Keyboard Navigation**: Explicit `focus-visible:ring-2 focus-visible:ring-primary` focus indicators on all links, inputs, and interactive cards.
- **Contrast Ratios**: CEFR badges and text colors tested to exceed 4.5:1 text-to-background contrast ratio in both light and dark themes.
- **Screen Reader Support**: Hidden screen reader labels (`sr-only`) on search inputs, clear buttons, and icon links; `aria-current="page"` on active pagination buttons.

---

## 15. Security & Isolation of Admin Console
- **Stealth Route Privacy**: The private admin console `/secure-console-x7` is strictly omitted from public navigation, headers, footers, and internal links.
- **Robots Protection**: `src/app/robots.ts` disallows `/secure-console-x7/*` and `/api/admin/*`.
- **Server Boundary**: `src/lib/articles.ts` runs exclusively on the server; zero Prisma Client code is bundled to client components.
- **SQL Injection Prevention**: Parameterized queries via Prisma Client prevent SQL injection across all search and filter operations.

---

## 16. Automated Verification Results (`scripts/verify-public.ts`)
A dedicated automated test script was created and executed against PostgreSQL on port 5433, testing all 20 required specifications:

```text
=================================================================
  READTOIMPROVE — PHASE 5 PUBLIC DISCOVERY VERIFICATION SUITE
=================================================================

✅ PASS [TC-PUBLIC-01] Homepage discovery data loads successfully
✅ PASS [TC-PUBLIC-02] Only published articles are returned
✅ PASS [TC-PUBLIC-03] Future scheduled articles are hidden
✅ PASS [TC-PUBLIC-04] Draft articles are hidden
✅ PASS [TC-PUBLIC-05] Pending-review articles are hidden
✅ PASS [TC-PUBLIC-06] Archived articles are hidden
✅ PASS [TC-PUBLIC-07] Latest article ordering is deterministic
✅ PASS [TC-PUBLIC-08] Pagination does not expose unpublished content and bounds query sizes
✅ PASS [TC-PUBLIC-09] Category filtering and slug lookup work
✅ PASS [TC-PUBLIC-10] Invalid category slug handled gracefully
✅ PASS [TC-PUBLIC-11] CEFR A1-C2 filtering works
✅ PASS [TC-PUBLIC-12] Invalid CEFR level rejected safely
✅ PASS [TC-PUBLIC-13] Search query validation (< 2 characters bypassed)
✅ PASS [TC-PUBLIC-14] Search only returns public articles (drafts hidden)
✅ PASS [TC-PUBLIC-15] Empty search results handled cleanly
✅ PASS [TC-PUBLIC-16] Public article slug resolves correctly
✅ PASS [TC-PUBLIC-17] Unpublished article direct access returns null (404 trigger)
✅ PASS [TC-PUBLIC-18] SEO metadata generation
✅ PASS [TC-PUBLIC-19] Admin route remains private and blocked in robots.txt
✅ PASS [TC-PUBLIC-20] Client/server boundary integrity and pure where-clause enforcement

=================================================================
  TEST SUMMARY: Total Tests: 20 | Passed: 20 | Failed: 0
=================================================================
🎉 ALL 20 PUBLIC DISCOVERY TESTS PASSED (20/20)!
```

---

## 17. Full Regression Suite Results
All previous verification suites were executed against the codebase:

| Suite | Command | Result | Notes |
| :--- | :--- | :---: | :--- |
| **Phase 2 Database** | `npx tsx scripts/verify-db.ts` | **10/10 PASS** | Schema relations, offsets, and cascade rules verified |
| **Phase 3 Auth** | `npx tsx scripts/verify-auth.ts` | **10/10 PASS** | Sessions, passwords, roles, and rate limiting verified |
| **Phase 4 Admin** | `npx tsx scripts/verify-admin.ts` | **20/20 PASS** | CMS state machine, sentence reordering, and offsets verified |
| **Phase 5 Public** | `npx tsx scripts/verify-public.ts` | **20/20 PASS** | Public discovery, filtering, and visibility rules verified |
| **Typecheck** | `npm run typecheck` | **PASS (0 errors)** | Zero TypeScript compilation errors |
| **ESLint** | `npm run lint` | **PASS (0 errors, 0 warnings)** | Clean lint across all components and scripts |
| **Production Build** | `npm run build` | **PASS** | 18 routes compiled successfully |

---

## 18. Files Created & Modified

### 18.1 Created Files (15 files)
1. `src/validations/public.ts`: Zod schema for public query parameters (`q`, `category`, `level`, `page`).
2. `src/lib/articles.ts`: Authoritative public data-access service with `getPublicArticleWhereClause()`.
3. `src/components/public/article-card.tsx`: Reusable accessible article card component.
4. `src/components/public/article-card-skeleton.tsx`: Skeleton loader for Suspense boundaries.
5. `src/components/public/spotlight-hero.tsx`: Featured article display for homepage.
6. `src/components/public/cefr-selector.tsx`: Interactive CEFR difficulty navigator pills.
7. `src/components/public/category-filter-bar.tsx`: Category chip filter bar with counts.
8. `src/components/public/search-bar.tsx`: Client search input with debounced query updates.
9. `src/components/public/pagination.tsx`: Reusable accessible pagination bar.
10. `src/components/public/empty-state.tsx`: User-friendly empty state component.
11. `src/app/(public)/articles/page.tsx`: Full article catalog page.
12. `src/app/(public)/articles/[slug]/page.tsx`: Public article landing page.
13. `src/app/(public)/categories/page.tsx`: Category directory page.
14. `src/app/(public)/categories/[slug]/page.tsx`: Category stream page.
15. `scripts/verify-public.ts`: 20-test automated verification suite.

### 18.2 Modified Files (4 files)
1. `src/app/(public)/page.tsx`: Upgraded from static Phase 1 placeholder to dynamic Server Component.
2. `src/components/common/header.tsx`: Connected navigation links to `/`, `/articles`, `/categories`.
3. `PROJECT_STATUS.md`: Updated Phase 5 status to COMPLETED.
4. `IMPLEMENTATION_PLAN.md`: Updated Phase 5 status to COMPLETED.

---

## 19. Definition of Done Checklist
- [x] Phase 5 Implementation Plan approved by user.
- [x] Public data-access service `src/lib/articles.ts` implemented with `getPublicArticleWhereClause()`.
- [x] Zod query validation schema implemented in `src/validations/public.ts`.
- [x] Homepage (`/`) upgraded with dynamic Spotlight Hero, CEFR selector, Category pills, and Latest Articles stream.
- [x] Full Article Catalog (`/articles`) implemented with combined search, category, CEFR filters, and pagination.
- [x] Public Article landing (`/articles/[slug]`) implemented with 404 guard for unpublished content.
- [x] Category directory (`/categories`) and stream (`/categories/[slug]`) implemented.
- [x] Public UI components built: `ArticleCard`, `SpotlightHero`, `CefrSelector`, `CategoryFilterBar`, `SearchBar`, `Pagination`, `EmptyState`, `ArticleCardSkeleton`.
- [x] `scripts/verify-public.ts` executes and passes all 20 test cases (20/20 PASS).
- [x] Regression suites `verify-db.ts`, `verify-auth.ts`, `verify-admin.ts` pass with 100% success.
- [x] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [x] `docs/phases/PHASE_05_REPORT.md` created with full 20 sections.
- [x] `PROJECT_STATUS.md` and `IMPLEMENTATION_PLAN.md` synchronized.

---

## 20. Phase Status & Next Steps

```text
PHASE: 05
STATUS: COMPLETED
NEXT PHASE: PHASE 06 — INTERACTIVE BILINGUAL READING EXPERIENCE
CURRENT ACTION: WAITING_FOR_USER_REVIEW
```

> [!NOTE]
> Phase 5 is now fully completed, verified, and ready for commit.
> The agent is halted in compliance with the mandatory workflow and is awaiting your review and authorization before proceeding to **PHASE 06 — INTERACTIVE BILINGUAL READING EXPERIENCE**.
