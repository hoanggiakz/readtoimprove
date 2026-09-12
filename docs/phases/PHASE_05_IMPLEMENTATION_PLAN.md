# PHASE 05 — IMPLEMENTATION PLAN

```text
PHASE: 05
STATUS: PLAN
CURRENT DECISION: AWAITING_APPROVAL
```

## 1. Phase Objective
Design and implement the production-ready **Public Discovery & Content Browsing** layer for **ReadToImprove**. Empower Vietnamese English learners (IELTS/TOEFL candidates, university students, and working professionals) to discover authentic bilingual news articles through:
- **Homepage (`/`)**: Engaging Hero spotlight with featured article, CEFR level quick filter chips, active category browse bar, and latest bilingual articles stream.
- **Article Catalog (`/articles`)**: Reusable catalog with combined search, category filtering, CEFR filtering, deterministic sorting, and accessible pagination.
- **Category Browsing (`/categories` and `/categories/[slug]`)**: Dedicated category directory and category-specific article streams.
- **CEFR Level Discovery (`?level=B1`, etc.)**: Precision difficulty calibration across CEFR levels A1–C2.
- **PostgreSQL Search Foundation**: Case-insensitive bilingual keyword search across English/Vietnamese titles and excerpts.
- **Crawlable Article Landing (`/articles/[slug]`)**: SEO-optimized public article preview with metadata, source attribution, and seamless transition to the bilingual reader.
- **Zero Exposure of Private Admin Console**: Absolute isolation of `/secure-console-x7`.

---

## 2. Repository State Discovered

A comprehensive inspection of the current repository establishes the following baseline:
1. **Git State**:
   - Working tree is clean on branch `master`.
   - Phase 4 commit `9fc0c92` (`feat(phase-04): implement private admin cms, bilingual sentence editor, offset engine, and 20-test verification suite`) is the current `HEAD`.
2. **Database & Schema (`prisma/schema.prisma`)**:
   - `Article` model has all necessary fields: `id`, `slug`, `titleEn`, `titleVi`, `excerptEn`, `excerptVi`, `sourceName`, `sourceUrl`, `thumbnailUrl`, `videoUrl`, `cefrLevel`, `status`, `publishedAt`, `scheduledAt`, `viewsCount`, `readingTimeMinutes`, `metaTitle`, `metaDescription`, `canonicalUrl`, `ogImage`.
   - Existing composite indexes: `@@index([status, publishedAt])`, `@@index([cefrLevel])`, `@@index([slug])`.
   - **Schema Gap Analysis**: There is NO `featured Boolean` field on `Article`. In accordance with instructions, we will **NOT** invent an unauthorized schema column; the "Spotlight / Featured" article will be deterministically derived as the most recent published article (`publishedAt DESC`), or the most read published article.
3. **Application Shell (`src/app`)**:
   - `src/app/(public)/layout.tsx`: Houses `Header` and `Footer`.
   - `src/app/(public)/page.tsx`: Contains static Phase 1 placeholder demo copy; will be upgraded to a dynamic Server Component reading published articles from PostgreSQL via Prisma.
   - `src/components/common/header.tsx`: Features brand identity, desktop nav links, theme toggle, and session-aware login/logout controls (no admin links).
   - `src/components/common/footer.tsx`: Features copyright compliance notices, educational fair-use attribution, and topic links.
4. **Verification Baseline**:
   - Phase 2 Database suite (`scripts/verify-db.ts`): 10/10 tests PASS.
   - Phase 3 Auth suite (`scripts/verify-auth.ts`): 10/10 tests PASS.
   - Phase 4 Admin CMS suite (`scripts/verify-admin.ts`): 20/20 tests PASS.
   - TypeScript (`npm run typecheck`): 0 errors.
   - ESLint (`npm run lint`): 0 errors, 0 warnings.
   - Production build (`npm run build`): All 14 routes compiled with zero issues.

---

## 3. Previous-Phase Dependency Verification
Phase 5 directly depends on content created and managed in Phases 1–4:
- **Phase 1**: Semantic design tokens, CEFR palette (`b1`, `b2`, `c1`, `c2`), responsive shell layout, `Button`, `Badge`, and `ThemeToggle`.
- **Phase 2**: PostgreSQL 16 database, Prisma Client singleton (`src/lib/prisma.ts`), and original educational seeded articles (`prisma/seed.ts`).
- **Phase 3**: Dynamic `robots.ts` blocking `/secure-console-x7/*`, session helper `auth()`, and public header session awareness.
- **Phase 4**: Article state machine (`ArticleStatus.PUBLISHED`), scheduled publishing processor, and admin CMS mutations.
- **Dependency Status**: **100% Operational & Verified**.

---

## 4. Critical Public Visibility Rule (Server-Side Enforcement)

Under no circumstances may unpublished, draft, pending-review, archived, or future-scheduled articles be exposed to public visitors.

### 4.1 Authoritative Query Filter
Every public query MUST include the centralized server-side where clause:
```typescript
// src/lib/articles.ts
export function getPublicArticleWhereClause(extraWhere?: Prisma.ArticleWhereInput): Prisma.ArticleWhereInput {
  const now = new Date();
  return {
    ...extraWhere,
    status: ArticleStatus.PUBLISHED,
    publishedAt: {
      not: null,
      lte: now,
    },
  };
}
```

### 4.2 Forbidden Public Exposures
- `status === 'DRAFT'`: **BLOCKED**
- `status === 'PENDING_REVIEW'`: **BLOCKED**
- `status === 'ARCHIVED'`: **BLOCKED**
- `status === 'PUBLISHED'` but `publishedAt === null`: **BLOCKED**
- `status === 'PUBLISHED'` but `publishedAt > now`: **BLOCKED** (Scheduled in future)
- `scheduledAt > now` and not yet published: **BLOCKED**

This rule is enforced directly in Prisma queries in Server Components, eliminating reliance on client-side filtering or route obscurity.

---

## 5. Functional Scope
1. **Dynamic Homepage (`/`)**:
   - **Hero Spotlight Section**: Renders the top published article as the primary featured card with prominent reading time, CEFR badge, category chips, and source attribution.
   - **CEFR Difficulty Selector**: Interactive pills (A1, A2, B1, B2, C1, C2) displaying descriptive labels (e.g. B2 — Upper Intermediate) and direct filtering links.
   - **Active Categories Browse Bar**: Displays categories that have at least one published article.
   - **Latest Articles Feed**: Responsive grid of article cards sorted by `publishedAt DESC, id DESC`.
   - **Inline Search Bar**: Prominent search input with instant query submission.
   - **Educational Notice**: Explicit educational fair-use attribution notice preserved from Phase 1.
2. **Article Catalog (`/articles`)**:
   - Unified catalog page supporting multi-dimensional filtering:
     - Search term: `?q=sustainable`
     - Category filter: `?category=business`
     - CEFR filter: `?level=B2`
     - Page parameter: `?page=2`
   - Active filter summary chips with "Clear all filters" button.
   - Article count indicator (`Hiển thị X / Y bài viết`).
3. **Category Directory & Stream (`/categories` & `/categories/[slug]`)**:
   - `/categories`: Grid of all categories with bilingual names, descriptions, and live published article counts.
   - `/categories/[slug]`: Dedicated category stream with category banner, article grid, and breadcrumbs. If slug is invalid or contains zero published articles, handles with clear empty/404 state.
4. **Article Preview / Entry Page (`/articles/[slug]`)**:
   - Public landing for the article providing SEO metadata, reading time, full bilingual title and excerpts, source attribution, and a clear "Bắt đầu đọc song ngữ" action button (pre-wired for Phase 6 bilingual reader).
   - If the article is not published, returns `notFound()` triggering `not-found.tsx`.
5. **Reusable Article Card Component (`src/components/public/article-card.tsx`)**:
   - Accessible `<article>` element.
   - Thumbnail with fallback gradient/image.
   - CEFR difficulty badge with semantic coloring.
   - Category tags.
   - English title and Vietnamese translation subtitle.
   - English/Vietnamese excerpt snippet.
   - Metadata line: Estimated reading time (`readingTimeMinutes`), publication date (`publishedAt`), and source attribution (`sourceName`).
6. **Accessible Pagination (`src/components/public/pagination.tsx`)**:
   - Previous / Next buttons with visible disabled states.
   - Numeric page indicators with active state.
   - URL query preservation across page changes.
7. **Empty & Loading States**:
   - Skeleton card loaders (`src/components/public/article-card-skeleton.tsx`) for Suspense boundaries.
   - User-friendly empty states with helpful reset actions when no articles match filter criteria.

---

## 6. Non-Functional Scope
- **Performance**:
  - 100% React Server Components (RSC) for data-fetching pages; minimal client JavaScript.
  - Bounded database queries (`take: 12`, `skip: offset`).
  - Index utilization: queries leverage `@@index([status, publishedAt])` and `@@index([slug])`.
  - Target metrics: First Contentful Paint (FCP) < 1.5s, Time to Interactive (TTI) < 3.0s, Lighthouse Performance ≥ 90.
- **Accessibility**:
  - Strict compliance with **WCAG 2.1 Level AA**.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
  - Screen reader accessible labels on all links, inputs, and icon buttons.
  - Logical heading hierarchy: single `<h1>` per page, descending `<h2>`, `<h3>`.
- **Security**:
  - Input validation: Zod schema for query params (`q`, `category`, `level`, `page`).
  - Strict CEFR validation: only `A1`-`C2` accepted; arbitrary strings rejected.
  - Rejection of SQL injection via Prisma parameterized queries.
  - Zero leakage of admin routes (`/secure-console-x7`) in sitemaps, robots, or public DOM.
- **SEO**:
  - Dynamic OpenGraph metadata (`title`, `description`, `images`, `url`).
  - Semantic JSON-LD schema ready for public articles (`NewsArticle`).
  - Canonical URL tags on all discovery pages.

---

## 7. Architecture & Data Flow

```text
Browser Request (e.g. GET /articles?category=business&level=B2&page=1)
    ↓
Public Next.js Server Component (src/app/(public)/articles/page.tsx)
    ↓
Zod Validation of SearchParams (src/validations/public.ts)
    ↓
Public Data-Access Service Layer (src/lib/articles.ts)
    ├── Injects getPublicArticleWhereClause()
    │     (status === PUBLISHED && publishedAt !== null && publishedAt <= now)
    ├── Applies Category Filter (if valid slug)
    ├── Applies CEFR Filter (if valid CefrLevel)
    ├── Applies PostgreSQL Insensitive Search (if q >= 2 chars)
    └── Executes Bounded Prisma Query (take: 12, skip: offset, orderBy: [publishedAt desc, id desc])
    ↓
PostgreSQL 16 (via localhost:5433)
    ↓
Renders React Server Components (RSC)
    ├── ArticleCard components
    ├── CategoryBadge / CefrBadge components
    └── Pagination component
    ↓
HTML Streamed to Browser (Instant FCP, Zero Client Waterfalls)
```

---

## 8. Route Map

| Route | Page File | Purpose & Behavior |
| :--- | :--- | :--- |
| `/` | `src/app/(public)/page.tsx` | Main homepage with Spotlight Hero, CEFR discovery, category pills, and latest articles stream. |
| `/articles` | `src/app/(public)/articles/page.tsx` | Main article catalog with combined search, category, CEFR filters, and pagination. |
| `/articles/[slug]` | `src/app/(public)/articles/[slug]/page.tsx` | Public article landing with bilingual preview, attribution, and reading CTA. Returns 404 if not published. |
| `/categories` | `src/app/(public)/categories/page.tsx` | Category directory displaying all categories with published article counts. |
| `/categories/[slug]` | `src/app/(public)/categories/[slug]/page.tsx` | Category-specific article stream with category metadata and pagination. |

---

## 9. Component Plan

### 9.1 Public Components (`src/components/public/`)
1. `article-card.tsx`:
   - Renders article preview card with thumbnail, bilingual titles, excerpt, CEFR badge, category tags, reading time, published date, and source attribution.
2. `article-card-skeleton.tsx`:
   - Animated placeholder pulse card for Suspense loading states.
3. `spotlight-hero.tsx`:
   - Featured article display on the homepage with high visual hierarchy.
4. `cefr-selector.tsx`:
   - Interactive CEFR difficulty navigator (A1–C2) with level descriptions and direct filter links.
5. `category-filter-bar.tsx`:
   - Horizontal category chip bar with active state and published article counts.
6. `search-bar.tsx`:
   - Client search input with debounced submission or form action updating `?q=...`.
7. `pagination.tsx`:
   - Accessible pagination bar maintaining existing query parameters.
8. `empty-state.tsx`:
   - Friendly empty state for searches/filters with "Clear filters" action.

### 9.2 Common Navigation Updates
- `src/components/common/header.tsx`:
  - Update nav links to route to `/`, `/articles`, `/categories`.
  - Connect search icon button to open or focus the search interface.

---

## 10. Data-Access & Query Plan (`src/lib/articles.ts`)

Encapsulate all public queries into a dedicated service layer:
1. `getPublicArticles(options: GetPublicArticlesOptions)`:
   - Params: `page`, `pageSize` (default 12), `categorySlug`, `cefrLevel`, `searchQuery`, `excludeId`.
   - Where clause: Enforces `getPublicArticleWhereClause()`.
   - Bounded execution with `$transaction([findMany, count])`.
   - Returns: `{ articles, totalCount, totalPages, currentPage, hasNextPage, hasPrevPage }`.
2. `getSpotlightArticle()`:
   - Queries `findFirst` where `getPublicArticleWhereClause()`, ordered by `publishedAt DESC, id DESC`.
3. `getPublicArticleBySlug(slug: string)`:
   - Queries `findUnique` where `{ slug }`.
   - Verifies `status === PUBLISHED && publishedAt !== null && publishedAt <= now`.
   - If not satisfied, returns `null`.
4. `getPublicCategoriesWithCounts()`:
   - Queries categories with count of published articles only:
     ```typescript
     prisma.category.findMany({
       orderBy: { orderIndex: 'asc' },
       include: {
         _count: {
           select: {
             articles: {
               where: {
                 article: {
                   status: ArticleStatus.PUBLISHED,
                   publishedAt: { lte: new Date() },
                 },
               },
             },
           },
         },
       },
     });
     ```

---

## 11. Search & Filter Strategy
- **Search Engine**: PostgreSQL insensitive pattern matching via Prisma:
  ```typescript
  OR: [
    { titleEn: { contains: sanitizedQuery, mode: 'insensitive' } },
    { titleVi: { contains: sanitizedQuery, mode: 'insensitive' } },
    { excerptEn: { contains: sanitizedQuery, mode: 'insensitive' } },
    { excerptVi: { contains: sanitizedQuery, mode: 'insensitive' } },
  ]
  ```
- **Validation**:
  - Minimum query length: 2 characters (queries < 2 characters ignored to prevent full-table scan overhead).
  - Maximum query length: 100 characters.
  - Normalized: trimmed, multiple spaces collapsed.
- **CEFR Filtering**:
  - Validated against `CefrLevel` enum (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`).
  - Invalid values ignored gracefully.
- **Category Filtering**:
  - Validated against category slugs in database.

---

## 12. Pagination Strategy
- **Mechanism**: Page-based offset pagination with bounded page sizes (`PAGE_SIZE = 12`).
- **Deterministic Sort**:
  ```typescript
  orderBy: [
    { publishedAt: 'desc' },
    { id: 'desc' },
  ]
  ```
- **URL Convention**: `?page=2` (page 1 is default and omitted from clean URLs).
- **Bounds Checking**:
  - `page < 1` normalized to `1`.
  - `page > totalPages` handled gracefully showing empty state or page `totalPages`.

---

## 13. SEO Strategy
- **Metadata Generation**: Dynamic `generateMetadata()` on `/articles/[slug]` and `/categories/[slug]`.
- **OpenGraph & Twitter Cards**: Generates og:title, og:description, og:image (using article `thumbnailUrl` or `ogImage`), and canonical URLs.
- **Robots Behavior**: Public pages emit `<meta name="robots" content="index, follow" />`. Private `/secure-console-x7` remains strictly disallowed.
- **Semantic Structure**: Single `<h1>` per page, structured breadcrumb navigation.

---

## 14. Accessibility Strategy (WCAG 2.1 AA)
- Semantic HTML tags: `<main id="main-content">`, `<article>`, `<nav aria-label="Pagination">`.
- Focus visibility: High-contrast focus rings for all interactive elements.
- Accessible color contrast: CEFR badges tested to exceed 4.5:1 text-to-background contrast ratio in both dark and light modes.
- Screen reader announcements: `aria-current="page"` on active pagination buttons, `aria-busy="true"` on loading boundaries.

---

## 15. Performance Strategy
- **Zero Client Waterfall**: Data loaded server-side in parallel.
- **React Server Components**: Only interactive elements (`SearchBar`, `ThemeToggle`) use `"use client"`.
- **Image Optimization**: Next.js `<Image>` with priority on the Hero Spotlight and lazy loading on stream cards.
- **Safe Revalidation**: Next.js ISR / cache revalidation triggered when admin publishes or archives articles.

---

## 16. Verification Strategy & Test Cases (`scripts/verify-public.ts`)

A dedicated automated test script `scripts/verify-public.ts` will verify all 20 public discovery requirements:

| Test ID | Test Name | Target Behavior | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-PUBLIC-01** | Homepage Discovery Data | Fetch homepage data via public service | Spotlight article and latest feed return valid published records. |
| **TC-PUBLIC-02** | Only Published Articles Exposed | Query public service with diverse database states | 100% of returned articles have `status === PUBLISHED` and `publishedAt <= now`. |
| **TC-PUBLIC-03** | Future Scheduled Articles Hidden | Article with `scheduledAt > now` or `publishedAt > now` | Query excludes future-scheduled articles completely. |
| **TC-PUBLIC-04** | Draft Articles Hidden | Article with `status === DRAFT` | Never returned in public listings or by slug lookup. |
| **TC-PUBLIC-05** | Pending-Review Articles Hidden | Article with `status === PENDING_REVIEW` | Never returned in public listings or by slug lookup. |
| **TC-PUBLIC-06** | Archived Articles Hidden | Article with `status === ARCHIVED` | Never returned in public listings or by slug lookup. |
| **TC-PUBLIC-07** | Deterministic Sorting | Query latest articles | Ordered strictly by `publishedAt DESC, id DESC`. |
| **TC-PUBLIC-08** | Pagination Bounds & Integrity | Query page 1 and page 2 | Query sizes bounded by `pageSize`; zero unpublished items leak on any page. |
| **TC-PUBLIC-09** | Category Filtering | Filter by valid category slug | Only articles associated with specified category are returned. |
| **TC-PUBLIC-10** | Invalid Category Slug Handling | Filter by non-existent category slug | Returns empty result set gracefully without crashing. |
| **TC-PUBLIC-11** | CEFR Level Filtering | Filter by `level=B2` | Only articles with `cefrLevel === 'B2'` are returned. |
| **TC-PUBLIC-12** | Invalid CEFR Level Parameter | Filter by `level=INVALID` | Safely ignored or normalized without throwing 500. |
| **TC-PUBLIC-13** | Search Query Validation | Search query with `< 2` characters | Ignored / bypassed; prevents expensive single-character full-table scans. |
| **TC-PUBLIC-14** | Search Returns Only Published Matches | Search by keyword present in published and draft articles | Returns ONLY the published match; draft match is strictly excluded. |
| **TC-PUBLIC-15** | Empty Search Results | Search by keyword matching nothing | Returns `totalCount: 0`, empty articles array cleanly. |
| **TC-PUBLIC-16** | Public Article Slug Resolution | Look up published article by slug | Successfully returns article with categories, reading time, and excerpts. |
| **TC-PUBLIC-17** | Unpublished Article Direct Access Rejection | Attempt slug lookup on draft or archived article | Returns `null` (triggering Next.js 404 `notFound()`). |
| **TC-PUBLIC-18** | SEO Metadata Generation | Inspect metadata for public article | Contains valid title, description, and canonical URL. |
| **TC-PUBLIC-19** | Admin Route Privacy Verification | Inspect robots and public layout | `/secure-console-x7` remains strictly disallowed and omitted from public navigation. |
| **TC-PUBLIC-20** | Client/Server Boundary Integrity | Verify public service module | Exports pure server functions using server Prisma client; 0 client bundle leakage. |

---

## 17. Regression Verification Plan
Before concluding Phase 5, all previous verification suites must be executed and pass:
```bash
npx tsx scripts/verify-db.ts      # Phase 2 Database suite (10/10 PASS)
npx tsx scripts/verify-auth.ts    # Phase 3 Auth suite (10/10 PASS)
npx tsx scripts/verify-admin.ts   # Phase 4 Admin CMS suite (20/20 PASS)
npx tsx scripts/verify-public.ts  # Phase 5 Public Discovery suite (20/20 PASS)
npm run typecheck                # Static type checking
npm run lint                     # ESLint verification
npm run build                    # Production bundle compilation
```

---

## 18. Files to Create and Modify

### 18.1 Files to Create
- `[NEW]` `src/lib/articles.ts`: Authoritative public data-access service with `getPublicArticleWhereClause()`.
- `[NEW]` `src/validations/public.ts`: Zod schema for public query parameters (`q`, `category`, `level`, `page`).
- `[NEW]` `src/components/public/article-card.tsx`: Accessible article preview card.
- `[NEW]` `src/components/public/article-card-skeleton.tsx`: Skeleton loader for Suspense fallback.
- `[NEW]` `src/components/public/spotlight-hero.tsx`: Featured article Hero component.
- `[NEW]` `src/components/public/cefr-selector.tsx`: CEFR level navigation pills.
- `[NEW]` `src/components/public/category-filter-bar.tsx`: Category chip filter bar.
- `[NEW]` `src/components/public/search-bar.tsx`: Public search input component.
- `[NEW]` `src/components/public/pagination.tsx`: Reusable pagination bar.
- `[NEW]` `src/components/public/empty-state.tsx`: Reusable empty search/filter state.
- `[NEW]` `src/app/(public)/articles/page.tsx`: Full article catalog page.
- `[NEW]` `src/app/(public)/articles/[slug]/page.tsx`: Public article landing page.
- `[NEW]` `src/app/(public)/categories/page.tsx`: Category directory page.
- `[NEW]` `src/app/(public)/categories/[slug]/page.tsx`: Dedicated category stream page.
- `[NEW]` `scripts/verify-public.ts`: 20-test automated verification suite.
- `[NEW]` `docs/phases/PHASE_05_REPORT.md`: Post-implementation phase report.

### 18.2 Files to Modify
- `[MODIFY]` `src/app/(public)/page.tsx`: Replace Phase 1 placeholder copy with dynamic Spotlight Hero, CEFR selector, category pills, and latest articles stream.
- `[MODIFY]` `src/components/common/header.tsx`: Connect navigation links to `/`, `/articles`, `/categories`.
- `[MODIFY]` `PROJECT_STATUS.md`: Synchronize Phase 5 status.
- `[MODIFY]` `IMPLEMENTATION_PLAN.md`: Synchronize Phase 5 status.

### 18.3 Database / Schema Changes
- **NONE**. The existing 14 entities and indexes created in Phase 2 fully satisfy all Phase 5 requirements without alteration.

---

## 19. Risks & Mitigations
| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| **Accidental unpublished content leak** | **HIGH** | Encapsulate all public queries inside `getPublicArticleWhereClause()`. Enforce strict automated tests (`TC-PUBLIC-02` through `06`). |
| **Slow queries during keyword search** | Medium | Minimum 2-character query validation; bounded pagination (`take: 12`); leveraged existing indexes. |
| **Broken external links on invalid slugs** | Low | Gracefully trigger `notFound()` returning custom `not-found.tsx`. |
| **Non-deterministic sorting tie-breaks** | Low | Sort explicitly on `[publishedAt desc, id desc]`. |

---

## 20. Rollback Strategy
If any failure occurs during Phase 5 execution:
1. Revert uncommitted changes via `git checkout -- .` and `git clean -fd`.
2. Database schema remains untouched.
3. Automated test data created in `scripts/verify-public.ts` will use prefix `test-pub-` and be cleaned up in a `finally` block.

---

## 21. Explicit Out-of-Scope Items
- Full sentence-by-sentence interactive bilingual reading engine (Reserved for **Phase 6**).
- Vocabulary popovers and pronunciation audio playback (Reserved for **Phase 6 & 7**).
- Personal Word Bank drawer and saving vocabulary to profile (Reserved for **Phase 7**).
- User reading progress tracking and completion analytics (Reserved for **Phase 7**).
- External search engine infrastructure (Elasticsearch/Meilisearch) (PostgreSQL handles Phase 5 scale cleanly).
- Background cron workers (Reserved for **Phase 8/9**).

---

## 22. Definition of Done
- [ ] Phase 5 Implementation Plan approved by user.
- [ ] Public data-access service `src/lib/articles.ts` implemented with `getPublicArticleWhereClause()`.
- [ ] Zod query validation schema implemented in `src/validations/public.ts`.
- [ ] Homepage (`/`) upgraded with dynamic Spotlight Hero, CEFR selector, Category pills, and Latest Articles stream.
- [ ] Full Article Catalog (`/articles`) implemented with combined search, category, CEFR filters, and pagination.
- [ ] Public Article landing (`/articles/[slug]`) implemented with 404 guard for unpublished content.
- [ ] Category directory (`/categories`) and stream (`/categories/[slug]`) implemented.
- [ ] Public components built: `ArticleCard`, `SpotlightHero`, `CefrSelector`, `CategoryFilterBar`, `SearchBar`, `Pagination`, `EmptyState`, `ArticleCardSkeleton`.
- [ ] `scripts/verify-public.ts` executes and passes all 20 test cases (20/20 PASS).
- [ ] Regression suites `verify-db.ts`, `verify-auth.ts`, `verify-admin.ts` pass with 100% success.
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [ ] `docs/phases/PHASE_05_REPORT.md` created with full 20 sections.
- [ ] `PROJECT_STATUS.md` and `IMPLEMENTATION_PLAN.md` synchronized.
- [ ] User approval obtained before proceeding to Phase 6.

---

## 23. Strict Halt Notice

```text
PHASE: 05
STATUS: WAIT
DECISION: AWAITING_APPROVAL
```

> [!IMPORTANT]
> **NO IMPLEMENTATION HAS STARTED**:
> - No application source code, components, routes, or service files have been created or modified.
> - The agent has stopped in compliance with the mandatory workflow and is awaiting your explicit approval:
>   `APPROVE PHASE 5`
