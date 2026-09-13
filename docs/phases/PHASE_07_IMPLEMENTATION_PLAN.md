# PHASE 07 — IMPLEMENTATION PLAN: VOCABULARY & PERSONAL WORD BANK

## 1. Phase Objective
Build the production-ready personal vocabulary learning system for **ReadToImprove**. Connect the Phase 6 interactive bilingual reading experience with the user account persistence layer, empowering Vietnamese learners (IELTS/TOEFL students, professionals, and academics) to:
1. **Save / Unsave Vocabulary from Reader**: Turn the reading experience into an active vocabulary acquisition pipeline by enabling readers to save highlighted CEFR words directly from the vocabulary popover.
2. **Display Live Saved State in Reader**: Accurately reflect whether a word is saved in the user's personal collection without $N+1$ database queries.
3. **Personal Word Bank Management (`/word-bank`)**: Provide an authenticated dashboard to browse, search, filter, pronounce, review context, and remove saved vocabulary items.
4. **Contextual Retention**: Preserve the original article and sentence where the word was encountered, reinforcing memory and natural collocations.
5. **Multi-Dimensional Exploration**: Search by English headword and Vietnamese meaning, filter by CEFR level (`A1`–`C2`), and paginate efficiently.
6. **Strict Authorization & Data Isolation**: Enforce session-derived ownership so users can only view and mutate their own saved words.
7. **Accessible & Responsive UX**: WCAG 2.1 AA keyboard support, screen-reader status communication, touch-friendly controls, and seamless mobile-to-desktop responsiveness.

---

## 2. Current Repository Findings
Thorough inspection of the repository confirmed the following architectural realities:

| Component | Repository Path | Current Status & Capabilities |
| :--- | :--- | :--- |
| **Prisma Schema** | `prisma/schema.prisma` | Model `UserSavedVocabulary` **already exists** with `userId`, `vocabularyId`, `notes`, `isMastered`, `savedAt`, `@@unique([userId, vocabularyId])`, and `@@index([userId])`. |
| **Global Vocabulary** | `prisma/schema.prisma` | Model `Vocabulary` has all pedagogical fields: `word`, `normalizedLemma`, `ipa`, `pos`, `meaningVi`, `exampleEn`, `exampleVi`, `cefrLevel`, `audioUrl`. |
| **Authentication** | `src/lib/auth.ts`, `src/lib/security.ts` | Signed JWT session cookies via `jose`. `auth()` resolves `SessionUser`. `requireAuth(returnUrl)` enforces login redirect. |
| **Server Actions** | `src/lib/actions/auth.ts`, `admin.ts` | Established `ActionResult<T>` pattern for type-safe server responses with Zod validation. |
| **Article Reader** | `src/app/(public)/articles/[slug]/page.tsx` | Single query loads article with sentences & vocabularies. Maps to `SentenceDTO`. |
| **Vocabulary Popover** | `src/components/reader/vocabulary-popover.tsx` | Displays headword, IPA, CEFR badge, POS, audio trigger, Vietnamese meaning, examples. "Lưu từ" action currently marked as deferred. |
| **UI Primitives** | `src/components/ui/`, `src/components/public/` | `Button`, `Badge`, `CefrBadge`, `Pagination`, `SearchBar`, `EmptyState`, `CefrSelector` ready for reuse. |
| **Header / Nav** | `src/components/common/header.tsx` | Displays user name and logout when authenticated; ready to host "Sổ từ vựng" navigation link. |

---

## 3. Existing Architecture Reused
Phase 7 strictly adheres to the established project conventions:
- **Session Layer**: Reuses `auth()` and `requireAuth()` directly. No new authentication frameworks or parallel session cookies.
- **Data Access Layer**: Reuses singleton `prisma` from `src/lib/prisma.ts`.
- **Server Actions**: Extends `src/lib/actions/vocabulary.ts` using the project's standard `ActionResult<T>`.
- **UI Components**: Reuses `Pagination` (`src/components/public/pagination.tsx`), `CefrBadge` (`src/components/ui/cefr-badge.tsx`), `Button` (`src/components/ui/button.tsx`), and Lucide icons (`Bookmark`, `Star`, `Trash2`, `Search`, `Volume2`, `ExternalLink`).
- **Validation**: Uses Zod for search and mutation parameter validation.
- **Public Visibility Rule**: Reader page continues to enforce `getPublicArticleWhereClause()` from Phase 5.

---

## 4. Database Analysis
Inspecting `prisma/schema.prisma` lines 174–187 reveals:

```prisma
model UserSavedVocabulary {
  id           String     @id @default(cuid())
  userId       String
  vocabularyId String
  notes        String?
  isMastered   Boolean    @default(false)
  savedAt      DateTime   @default(now())

  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  vocabulary   Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  @@unique([userId, vocabularyId])
  @@index([userId])
}
```

### Relational Integrity Check:
1. **Primary Key**: `id String @id @default(cuid())`.
2. **Foreign Keys**:
   - `userId` $\rightarrow$ `User.id` (with `onDelete: Cascade`).
   - `vocabularyId` $\rightarrow$ `Vocabulary.id` (with `onDelete: Cascade`).
3. **Unique Constraint**: `@@unique([userId, vocabularyId])` guarantees that a given user cannot create duplicate saves of the same vocabulary item at the database level.
4. **Indexes**: `@@index([userId])` provides fast index-scans for querying a user's word collection.
5. **Metadata Fields**: `notes String?`, `isMastered Boolean @default(false)`, `savedAt DateTime @default(now())`.

---

## 5. Migration Decision: NO MIGRATION REQUIRED
**Decision**: **NO DATABASE MIGRATION IS NEEDED**.

The existing `UserSavedVocabulary` model designed in Phase 0 and implemented in Phase 2 completely satisfies all data persistence requirements for Phase 7. The compound unique index `[userId, vocabularyId]` enables safe atomic upserts and deletes. Preserving the schema without migration prevents any regression risks on existing seeded databases.

---

## 6. Authentication Strategy
1. **Server Components (`/word-bank`)**:
   - Executes `const user = await requireAuth('/word-bank');` at the top of the Server Component.
   - If unauthenticated, Next.js performs an internal redirect to `/login?returnUrl=%2Fword-bank`.
2. **Server Actions (`saveVocabularyAction`, `unsaveVocabularyAction`)**:
   - Calls `const session = await auth();`.
   - If `!session?.user?.id`, returns `{ success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập để thực hiện thao tác này.' }`.
   - The user ID is strictly extracted from `session.user.id`. The client is never permitted to pass a `userId` parameter.
3. **Public Article Reader (`/articles/[slug]`)**:
   - Calls `const session = await auth();` passively.
   - If unauthenticated, `session` is null, and the reader treats the user as an anonymous visitor (`isAuthenticated = false`, `savedVocabIds = []`).

---

## 7. Authorization Strategy
1. **Tenant Isolation**: Every database read, insert, and delete on `UserSavedVocabulary` enforces `where: { userId: session.user.id }`.
2. **Cross-User Protection**:
   - User A cannot view User B's saved vocabulary.
   - User A cannot delete or modify User B's saved vocabulary.
   - Any attempt to unsave a word with an ID not belonging to the authenticated user results in zero database modifications (`count: 0`).
3. **Global Content Protection**:
   - The global `Vocabulary` record cannot be mutated, modified, or deleted by standard users during Word Bank operations. Only the join entity `UserSavedVocabulary` is created or deleted.

---

## 8. Save / Unsave Semantics
All vocabulary save mutations must be idempotent and concurrency-safe:

```text
                  ┌─────────────────────────────────────────┐
                  │ User clicks "Lưu từ" / "Bỏ lưu"         │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                       Is user authenticated?
                                      / \
                                     /   \
                                   NO     YES
                                   /       \
                                  /         ▼
    Prompt login / redirect to /login       Derive currentUserId from session
                                            │
                                            ▼
                                   Action type requested
                                          /   \
                                         /     \
                                       SAVE   UNSAVE
                                       /         \
                                      ▼           ▼
                      Atomic Upsert               Atomic DeleteMany
             (userId, vocabularyId)              where: { userId, vocabularyId }
                      │                                   │
                      ▼                                   ▼
        Returns { isSaved: true }             Returns { isSaved: false }
```

### 8.1 Save Operation (`saveVocabularyAction`)
```typescript
await prisma.userSavedVocabulary.upsert({
  where: {
    userId_vocabularyId: {
      userId: session.user.id,
      vocabularyId,
    },
  },
  create: {
    userId: session.user.id,
    vocabularyId,
  },
  update: {
    savedAt: new Date(), // touch timestamp if already saved
  },
});
```
- **Concurrency Safety**: Utilizes Prisma's atomic `upsert` backed by the PostgreSQL `ON CONFLICT (user_id, vocabulary_id) DO UPDATE` clause. Two concurrent save requests will never throw a duplicate key error (`P2002`).

### 8.2 Unsave Operation (`unsaveVocabularyAction`)
```typescript
await prisma.userSavedVocabulary.deleteMany({
  where: {
    userId: session.user.id,
    vocabularyId,
  },
});
```
- **Idempotency**: `deleteMany` returns `{ count: n }`. If the word was already unsaved, it safely returns `{ count: 0 }` without throwing a `RecordNotFound` exception.

---

## 9. Article Reader Integration (Zero N+1 Strategy)
To provide real-time visual feedback in the Article Reader without degrading server performance:

### 9.1 Single Batch Query on Article Load
In `src/app/(public)/articles/[slug]/page.tsx`:
```typescript
const session = await auth();
let initialSavedVocabIds: string[] = [];

if (session?.user?.id) {
  // 1. Collect all distinct vocabulary IDs present in this article's sentences
  const articleVocabIds = Array.from(
    new Set(
      article.sentences.flatMap((s) =>
        s.vocabularies.map((v) => v.vocabulary?.id).filter(Boolean)
      )
    )
  ) as string[];

  // 2. Fetch saved state in ONE indexed batch query (WHERE userId = :uid AND vocabularyId IN (:ids))
  if (articleVocabIds.length > 0) {
    const savedRecords = await prisma.userSavedVocabulary.findMany({
      where: {
        userId: session.user.id,
        vocabularyId: { in: articleVocabIds },
      },
      select: { vocabularyId: true },
    });
    initialSavedVocabIds = savedRecords.map((r) => r.vocabularyId);
  }
}
```
- **Performance**: Exactly **one** indexed query (`O(log N)` via `@@index([userId])` and primary key index on `vocabularyId`).
- **Zero N+1**: Never queries `UserSavedVocabulary` per sentence or per highlight.
- **Unauthenticated Visitors**: Zero extra queries executed.

### 9.2 Client-Side State Management in Reader
- `BilingualSentenceList` maintains an in-memory `savedVocabIds: Set<string>` initialized from `initialSavedVocabIds`.
- When a user saves or unsaves a word in `VocabularyPopover`:
  1. Optimistically updates the `Set<string>`.
  2. Dispatches `saveVocabularyAction` or `unsaveVocabularyAction`.
  3. If the server action fails, rolls back the optimistic update and displays an error toast.
  4. If unauthenticated, displays an accessible dialog/toast prompt: *"Vui lòng đăng nhập để lưu từ vào Sổ từ vựng cá nhân."* with a direct link to `/login`.

---

## 10. Word Bank Architecture (`/word-bank`)
The personal Word Bank will be located at:

```text
/word-bank
```

### 10.1 Layout & Hierarchy
```text
Header (Session-aware with "Sổ từ vựng" active link)
  │
  ▼
Word Bank Page (src/app/(public)/word-bank/page.tsx)
  │
  ├── Breadcrumb & Header Title ("Sổ từ vựng cá nhân")
  │     └── Total saved words counter badge
  │
  ├── Filter & Search Bar
  │     ├── Search Input (English headword & Vietnamese meaning)
  │     └── CEFR Filter Pills (All, A1, A2, B1, B2, C1, C2)
  │
  ├── Word Bank Content
  │     ├── Empty State (when collection is empty or filters yield 0 results)
  │     └── Word Bank List (Responsive Card Grid)
  │           └── Word Bank Item Card
  │                 ├── Header: Word, IPA, Pronunciation Audio Button, CEFR Badge, POS
  │                 ├── Body: Vietnamese Meaning (high contrast)
  │                 ├── Context Box: Sentence in original article + Article link
  │                 ├── Footer: Saved date ("Lưu ngày dd/mm/yyyy") + Remove Button
  │
  └── Server-Side Pagination (Reusing src/components/public/pagination.tsx)
```

---

## 11. Search Design
Learners must be able to quickly locate vocabulary in their personal collection.
- **Input**: Keyword string `q` via search parameters (`?q=sustainable`).
- **Validation**: Minimum 2 characters, trimmed, max 100 characters via Zod.
- **Database Query**: Scoped strictly to the current user with case-insensitive matching across:
  1. `vocabulary.word`: Matches English term.
  2. `vocabulary.meaningVi`: Matches Vietnamese definition.
- **Prisma Where Clause**:
  ```typescript
  where: {
    userId: user.id,
    ...(q ? {
      vocabulary: {
        OR: [
          { word: { contains: q, mode: 'insensitive' } },
          { meaningVi: { contains: q, mode: 'insensitive' } },
        ],
      },
    } : {}),
  }
  ```

---

## 12. Filter Design
### In-Scope Filters:
1. **CEFR Level Filter**:
   - Supported values: `ALL` (default), `A1`, `A2`, `B1`, `B2`, `C1`, `C2`.
   - Validated via `z.nativeEnum(CefrLevel)`.
   - Styled using established CEFR tokens (`cefr-b1`, `cefr-b2`, etc.).
2. **Search Keyword**:
   - English and Vietnamese text search.

### Deferred Filters (Reserved for Future Learning Analytics):
- `isMastered` toggle (Learned / Needs Review) $\rightarrow$ Deferred to Phase 9.
- Custom user tags / folders $\rightarrow$ Deferred.

---

## 13. Pagination Strategy
- **Evaluation**:
  - *Cursor Pagination*: Excellent for infinite scroll, but lacks direct page jump numbers.
  - *Offset Pagination*: Highly intuitive for educational review tables, aligns with the existing `Pagination` component in `src/components/public/pagination.tsx`.
- **Decision**: **Server-Side Offset Pagination**.
  - Default `limit = 12` items per page.
  - Query parameter: `?page=1`.
  - Prisma queries executed in parallel via `Promise.all`:
    1. `findMany({ skip: (page - 1) * limit, take: limit, orderBy: { savedAt: 'desc' } })`
    2. `count({ where })`
  - Max page ceiling: 1,000 pages.

---

## 14. Cache & Revalidation Strategy
- **Route Segment Config**:
  ```typescript
  export const dynamic = 'force-dynamic';
  ```
  `/word-bank` contains private, user-specific learning data. It must **never** be cached statically or served from a public CDN edge cache.
- **On Mutation**:
  - `saveVocabularyAction` and `unsaveVocabularyAction` invoke `revalidatePath('/word-bank')` and `revalidatePath('/articles/[slug]')`.
  - Client state updates optimistically for instantaneous feedback.
- **SEO Robots**:
  ```typescript
  export const metadata: Metadata = {
    title: 'Sổ từ vựng cá nhân | ReadToImprove',
    robots: {
      index: false,
      follow: false,
    },
  };
  ```
  Personal Word Bank pages are explicitly excluded from search engine indexers.

---

## 15. API & Server Action Contracts

### 15.1 Action: `saveVocabularyAction`
- **File**: `src/lib/actions/vocabulary.ts`
- **Input**: `{ vocabularyId: string }`
- **Authentication**: `auth()` required.
- **Validation**: Zod schema validating valid CUID string.
- **Operation**: `prisma.userSavedVocabulary.upsert`.
- **Return Type**:
  ```typescript
  ActionResult<{ isSaved: boolean; vocabularyId: string }>
  ```
- **Error Handling**: Catches database errors, logs securely, returns friendly message.

### 15.2 Action: `unsaveVocabularyAction`
- **File**: `src/lib/actions/vocabulary.ts`
- **Input**: `{ vocabularyId: string }`
- **Authentication**: `auth()` required.
- **Validation**: Zod schema validating valid CUID string.
- **Operation**: `prisma.userSavedVocabulary.deleteMany`.
- **Return Type**:
  ```typescript
  ActionResult<{ isSaved: boolean; vocabularyId: string }>
  ```

### 15.3 Action: `toggleSaveVocabularyAction`
- **File**: `src/lib/actions/vocabulary.ts`
- **Input**: `{ vocabularyId: string }`
- **Behavior**: Checks existing relation. If exists, deletes; if not, upserts. Returns updated state.

---

## 16. Component Architecture

```text
src/
├── app/
│   └── (public)/
│       ├── articles/[slug]/
│       │   └── page.tsx                [MODIFY: pass initialSavedVocabIds & session]
│       └── word-bank/
│           ├── page.tsx                [NEW: Authenticated Word Bank server page]
│           ├── loading.tsx             [NEW: Skeleton grid for Word Bank]
│           └── error.tsx               [NEW: Error recovery boundary]
│
├── components/
│   ├── common/
│   │   └── header.tsx                  [MODIFY: add "Sổ từ vựng" navigation link]
│   │
│   ├── reader/
│   │   ├── bilingual-sentence-list.tsx [MODIFY: manage savedVocabIds Set]
│   │   ├── bilingual-sentence-item.tsx [MODIFY: pass isSaved & onToggleSave]
│   │   └── vocabulary-popover.tsx      [MODIFY: activate "Lưu từ" / "Đã lưu" button]
│   │
│   └── word-bank/
│       ├── word-bank-header.tsx        [NEW: Title, total counter, breadcrumb]
│       ├── word-bank-filter-bar.tsx    [NEW: Search input + CEFR level pills]
│       ├── word-bank-card.tsx          [NEW: Vocabulary learning card with context]
│       └── word-bank-empty.tsx         [NEW: Educational empty state with CTA]
│
├── lib/
│   ├── actions/
│   │   └── vocabulary.ts               [NEW: Server actions for save/unsave/toggle]
│   └── vocabulary.ts                   [NEW: Data-access queries for Word Bank]
│
└── validations/
    └── word-bank.ts                    [NEW: Zod schemas for query & mutations]
```

---

## 17. Context Information Retention
To maximize learning transfer, each saved vocabulary item in the Word Bank displays the context in which it was encountered:
1. **Query Strategy**: When fetching `UserSavedVocabulary`, include the first sentence instance associated with this vocabulary:
   ```typescript
   include: {
     vocabulary: {
       include: {
         sentenceInstances: {
           take: 1,
           select: {
             sentence: {
               select: {
                 textEn: true,
                 textVi: true,
                 article: {
                   select: {
                     slug: true,
                     titleEn: true,
                   },
                 },
               },
             },
           },
         },
       },
     },
   }
   ```
2. **Display**:
   - The card shows: *"Ngữ cảnh trong bài:"* followed by the English sentence with the word highlighted.
   - An anchor link *"Xem trong bài viết: [Article Title]"* links directly to `/articles/[slug]`.
   - Fallback: If no sentence instance is linked, the card displays `vocabulary.exampleEn` and `vocabulary.exampleVi`.

---

## 18. Accessibility Strategy (WCAG 2.1 AA)
- **Semantic HTML**: `<main>`, `<section>`, `<article>` cards, native `<button>` elements.
- **Aria Attributes**:
  - Bookmark/Save buttons: `aria-label="Lưu từ vựng sustainable vào Sổ từ vựng"` / `aria-label="Bỏ lưu từ vựng sustainable"`.
  - `aria-pressed={isSaved}` on toggle buttons.
  - Search input with associated `<label>` and `aria-describedby`.
- **Keyboard Navigation**:
  - Full `Tab` sequence across search bar, CEFR filters, audio speaker buttons, remove buttons, and pagination links.
  - High visibility focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
- **No Color-Only Information**: Saved state uses both visual icon changes (filled bookmark vs outline star) and explicit Vietnamese text (`Đã lưu` vs `Lưu từ`).

---

## 19. Responsive Strategy
- **Mobile (<640px)**: Single column card stack. Toolbar elements wrap cleanly. Search bar is full-width. Audio button and remove button have minimum $44 \times 44$px touch targets.
- **Tablet (640px–1024px)**: 2-column grid (`grid-cols-1 sm:grid-cols-2`).
- **Desktop (>1024px)**: 3-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Context box remains legible without awkward word wrapping.

---

## 20. Security Analysis
1. **Session Forgery Prevention**: All mutations reject client-supplied user identifiers and rely strictly on cryptographic JWT tokens validated against PostgreSQL.
2. **Audit & Tamper Resistance**:
   - Unauthenticated access attempts to `/word-bank` redirect to login.
   - Unauthenticated Server Action calls fail with `UNAUTHORIZED`.
   - Cannot delete or query records outside `where: { userId: session.user.id }`.
3. **No Private Route Leakage**: `/word-bank` is protected; public `robots.ts` excludes indexing.

---

## 21. Performance Analysis
- **Query Complexity**:
  - Word Bank page query uses `UserSavedVocabulary` indexed on `userId`.
  - Search filter applies indexed text lookup on `Vocabulary`.
  - Pagination limits records to 12 items per request.
- **Client Bundle Size**: Word Bank cards and lists are primarily React Server Components; interactivity (audio play, delete modal/toast, filter bar) is isolated into minimal client islands.
- **Expected Scale**: Efficient execution for users with 10, 100, 1,000, or 10,000+ saved words due to indexed pagination.

---

## 22. Detailed Test Plan (`scripts/verify-word-bank.ts`)
Create a comprehensive test suite containing at least 28 automated test cases:

### Authentication & Authorization (TC-WB-01 to TC-WB-04)
- `TC-WB-01`: Unauthenticated visitor to `/word-bank` is rejected / redirected to login.
- `TC-WB-02`: Authenticated user can access `/word-bank` data query.
- `TC-WB-03`: Server actions derive `userId` solely from session, rejecting external user spoofing.
- `TC-WB-04`: User A cannot read, query, or enumerate User B's saved vocabulary.

### Save Functionality (TC-WB-05 to TC-WB-09)
- `TC-WB-05`: Save vocabulary creates a `UserSavedVocabulary` record linked to current user.
- `TC-WB-06`: Duplicate save of already-saved vocabulary is prevented via unique constraint and upsert.
- `TC-WB-07`: Saving a nonexistent `vocabularyId` is safely rejected with clear error.
- `TC-WB-08`: Save action preserves global `Vocabulary` record integrity (zero mutations to global vocab).
- `TC-WB-09`: Unauthenticated save attempt returns `UNAUTHORIZED` status.

### Unsave & Removal Functionality (TC-WB-10 to TC-WB-13)
- `TC-WB-10`: Unsave vocabulary deletes the corresponding `UserSavedVocabulary` record.
- `TC-WB-11`: Unsave on a word not currently saved is a safe, idempotent no-op.
- `TC-WB-12`: User A cannot delete or unsave User B's saved vocabulary item.
- `TC-WB-13`: Removing a saved word does not delete or cascade to the global `Vocabulary` table.

### Article Reader Integration (TC-WB-14 to TC-WB-17)
- `TC-WB-14`: Article reader correctly identifies unsaved vocabulary for authenticated user.
- `TC-WB-15`: Article reader correctly identifies saved vocabulary (`initialSavedVocabIds`).
- `TC-WB-16`: Unauthenticated reader view executes zero queries on `UserSavedVocabulary`.
- `TC-WB-17`: Batch saved-state lookup avoids $N+1$ query pattern (single query with `IN` filter).

### Word Bank Queries & Filtering (TC-WB-18 to TC-WB-23)
- `TC-WB-18`: Word Bank returns saved words in reverse chronological order (`savedAt DESC`).
- `TC-WB-19`: Search by English headword filters accurately (`mode: 'insensitive'`).
- `TC-WB-20`: Search by Vietnamese definition filters accurately.
- `TC-WB-21`: CEFR level filter isolates matching vocabulary levels (`B1`, `B2`, `C1`, etc.).
- `TC-WB-22`: Combined search and CEFR filter yields exact intersection.
- `TC-WB-23`: Server-side pagination computes correct `totalPages`, `skip`, and `take`.

### Data Retention & Context (TC-WB-24 to TC-WB-25)
- `TC-WB-24`: Saved vocabulary retains contextual article and sentence reference where available.
- `TC-WB-25`: Fallback to vocabulary examples when no article instance exists.

### Security, SEO & Accessibility (TC-WB-26 to TC-WB-28)
- `TC-WB-26`: Word Bank metadata includes `robots: { index: false, follow: false }`.
- `TC-WB-27`: Empty state renders accessible guidance and reading CTA.
- `TC-WB-28`: Zero Prisma or database credential leakage across client DTO boundaries.

---

## 23. Browser E2E Verification Plan
Once authorized for IMPLEMENT/TEST, the browser subagent will verify:
1. **Login Flow**: Sign in as standard learner (`user@example.com`).
2. **Article Reader Flow**:
   - Open `/articles/clean-energy-microgrids-urban-resilience`.
   - Open vocabulary popover on highlighted word (e.g. `"sustainable"`).
   - Verify initial state is `☆ Lưu từ`.
   - Click `☆ Lưu từ`. Verify button immediately transitions to `✓ Đã lưu`.
3. **Word Bank Flow**:
   - Click `Sổ từ vựng` in the header navigation.
   - Verify navigation to `/word-bank`.
   - Verify `"sustainable"` appears as a learning card with CEFR badge, IPA, Vietnamese meaning, and article context.
   - Click the pronunciation audio button; verify audio trigger.
   - Search for `"sustainable"` in search input; verify filter works.
   - Filter by CEFR `B2`; verify card remains visible. Filter by `C1`; verify empty filter state.
   - Click `Xóa khỏi sổ từ` (Remove); verify card is removed and empty state is rendered.
4. **Reader State Sync**:
   - Navigate back to `/articles/clean-energy-microgrids-urban-resilience`.
   - Open vocabulary popover on `"sustainable"`.
   - Verify state has reverted to `☆ Lưu từ`.
5. **Mobile Viewport Test**:
   - Resize to mobile dimensions ($375 \times 667$).
   - Verify card wrapping, touch target accessibility, and lack of horizontal overflow.

---

## 24. Full Regression Plan
Phase 7 verification will execute the complete test suite sequence:
1. `npx tsx scripts/verify-db.ts` (Phase 2 DB persistence)
2. `npx tsx scripts/verify-auth.ts` (Phase 3 Authentication & Stealth Admin)
3. `npx tsx scripts/verify-admin.ts` (Phase 4 Admin CMS)
4. `npx tsx scripts/verify-public.ts` (Phase 5 Public Discovery & Catalog)
5. `npx tsx scripts/verify-reader.ts` (Phase 6 Article Reading Experience)
6. `npx tsx scripts/verify-word-bank.ts` (Phase 7 Personal Word Bank)
7. `npm run typecheck`
8. `npm run lint`
9. `npm run build`

---

## 25. Edge Cases & Handling
1. **Unauthenticated User Clicks Save**:
   - Display a non-blocking toast/dialog informing the user that saving requires an account, with a 1-click button to `/login?returnUrl=/articles/[slug]`.
2. **Concurrent Save Requests**:
   - Handled cleanly by PostgreSQL compound unique constraint `@@unique([userId, vocabularyId])` and Prisma `upsert`.
3. **Unsaved Vocabulary Deleted by Admin**:
   - Handled cleanly by foreign key cascade `onDelete: Cascade` on `UserSavedVocabulary`.
4. **Vocabulary Without Article Sentence Context**:
   - Graceful fallback to `vocabulary.exampleEn` and `vocabulary.exampleVi`.
5. **Very Long Vietnamese Definition or Notes**:
   - Cards use `break-words` and clamped line heights to prevent visual overflow.
6. **Network Failure on Save/Unsave**:
   - Client optimistic UI rolls back to previous state and alerts user.

---

## 26. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **$N+1$ Query in Article Reader** | Server latency spikes on articles with 20+ vocabulary highlights. | Fetch all saved vocabulary IDs in a single `findMany({ where: { userId, vocabularyId: { in: ids } } })` batch query. |
| **Cross-User Data Leakage** | Privacy violation; users see others' saved words. | All queries and mutations strictly enforce `where: { userId: session.user.id }` derived from the verified JWT session. |
| **Hydration Mismatch on Saved State** | Client UI flickers or fails hydration. | Pass `initialSavedVocabIds` as server-rendered props; synchronize state cleanly without reading `localStorage`. |
| **Public Indexing of Word Bank** | Search engines index private user pages. | Set `robots: { index: false, follow: false }` on `/word-bank` layout/metadata. |

---

## 27. Acceptance Criteria (Definition of Done)
- [ ] Authenticated user can save vocabulary from the Article Reader popover.
- [ ] Authenticated user can unsave vocabulary from the Article Reader popover.
- [ ] Unauthenticated users are prompted to log in when attempting to save words.
- [ ] Duplicate saves are prevented via database unique constraints and atomic upsert.
- [ ] Article Reader displays accurate live saved state with zero $N+1$ queries.
- [ ] Dedicated `/word-bank` page is protected by `requireAuth()`.
- [ ] `/word-bank` displays saved words in reverse chronological order.
- [ ] English and Vietnamese keyword search works within the user's Word Bank.
- [ ] CEFR difficulty filtering (`A1`–`C2`) works accurately.
- [ ] Saved vocabulary cards display headword, IPA, POS, audio button, CEFR badge, Vietnamese meaning, and original article/sentence context.
- [ ] Users can remove words directly from `/word-bank`.
- [ ] User A cannot view, query, or delete User B's saved vocabulary.
- [ ] Word Bank has accessible empty state and skeleton loading state.
- [ ] Header displays "Sổ từ vựng" navigation link for authenticated users.
- [ ] Automated verification script `scripts/verify-word-bank.ts` passes 100%.
- [ ] All previous regression suites (`verify-db`, `verify-auth`, `verify-admin`, `verify-public`, `verify-reader`) pass 100%.
- [ ] `typecheck`, `lint`, and `build` succeed with 0 errors.
- [ ] Browser E2E verification completes successfully.
- [ ] Comprehensive `docs/phases/PHASE_07_REPORT.md` is generated.
- [ ] Git commit created on clean working tree.
- [ ] Final status set to `WAIT`.

---

## 28. Implementation Sequence
When Phase 7 is approved, implementation will proceed through the following orderly steps:

```text
Step 01: Create Zod validation schemas (src/validations/word-bank.ts)
Step 02: Implement vocabulary Server Actions (src/lib/actions/vocabulary.ts)
Step 03: Implement Word Bank data-access queries (src/lib/vocabulary.ts)
Step 04: Update Article Reader Server Component (batch saved-state lookup)
Step 05: Update Reader Components (BilingualSentenceList, BilingualSentenceItem, VocabularyPopover)
Step 06: Update Header navigation with "Sổ từ vựng" link for authenticated sessions
Step 07: Create Word Bank UI components (WordBankCard, WordBankFilterBar, WordBankEmpty)
Step 08: Implement Word Bank route pages (src/app/(public)/word-bank/page.tsx, loading.tsx, error.tsx)
Step 09: Build automated verification suite (scripts/verify-word-bank.ts)
Step 10: Run full test suite and complete regression verification
Step 11: Execute live browser E2E verification
Step 12: Perform senior engineer code review & create PHASE_07_REPORT.md
Step 13: Create Git commit and transition phase status to WAIT
```

---

## 29. Files to Create & Modify

### NEW Files to Create:
1. `src/validations/word-bank.ts` (Zod schemas for search query and mutation inputs)
2. `src/lib/actions/vocabulary.ts` (Server actions for save, unsave, toggle)
3. `src/lib/vocabulary.ts` (Data-access layer for Word Bank queries and context resolution)
4. `src/components/word-bank/word-bank-card.tsx` (Learning card with context and audio)
5. `src/components/word-bank/word-bank-filter-bar.tsx` (Search input and CEFR pills)
6. `src/components/word-bank/word-bank-empty.tsx` (Educational empty state with CTA)
7. `src/app/(public)/word-bank/page.tsx` (Authenticated Word Bank server page)
8. `src/app/(public)/word-bank/loading.tsx` (Skeleton loading grid)
9. `src/app/(public)/word-bank/error.tsx` (Error recovery boundary)
10. `scripts/verify-word-bank.ts` (28-test automated verification suite)
11. `docs/phases/PHASE_07_IMPLEMENTATION_PLAN.md` (This document)

### EXISTING Files to Modify:
1. `src/app/(public)/articles/[slug]/page.tsx` (Single batch lookup of saved vocabulary IDs)
2. `src/components/reader/bilingual-sentence-list.tsx` (Manage saved state Set)
3. `src/components/reader/bilingual-sentence-item.tsx` (Pass saved state to popover)
4. `src/components/reader/vocabulary-popover.tsx` (Activate "Lưu từ" / "Đã lưu" interaction)
5. `src/components/common/header.tsx` (Add "Sổ từ vựng" link for authenticated users)
6. `PROJECT_STATUS.md` (Update phase tracking)
7. `IMPLEMENTATION_PLAN.md` (Update phase roadmap)

---

## 30. Explicit Out-of-Scope Items
The following capabilities are reserved for subsequent phases and will NOT be implemented in Phase 7:
- **Phase 08**: Global full-text article search and catalog autocomplete.
- **Phase 09**: User reading history tracking, favorites list, and spaced-repetition flashcards.
- **Phase 10**: Advanced site-wide performance auditing and Lighthouse score optimization.
- **Paid TTS API**: Third-party speech APIs (Web Speech API and existing `audioUrl` are strictly reused).
- **Custom User Folders/Decks**: Multi-folder vocabulary taxonomy.
