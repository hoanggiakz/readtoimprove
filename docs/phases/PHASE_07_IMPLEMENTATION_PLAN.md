# PHASE 07 — IMPLEMENTATION PLAN v1.1: VOCABULARY & PERSONAL WORD BANK

> **Revision Note**: v1.1 fixes 5 critical bugs and 12 improvements identified in senior review of v1.0. Changes are marked with `[v1.1-FIX]` or `[v1.1-IMPROVE]` for traceability.

---

## 0. Changelog v1.0 → v1.1

| # | Type | Change |
| :-: | :--- | :--- |
| 1 | 🔴 **CRITICAL** | Removed `toggleSaveVocabularyAction` (race condition). Replaced with explicit `saveVocabularyAction` + `unsaveVocabularyAction`. |
| 2 | 🔴 **CRITICAL** | Fixed `revalidatePath('/articles/[slug]')` $\rightarrow$ tag-based revalidation via `revalidateTag`. |
| 3 | 🔴 **CRITICAL** | Added trigram index migration for `ILIKE '%...%'` search performance. |
| 4 | 🔴 **CRITICAL** | Fixed $N+1$ in Word Bank context query $\rightarrow$ batch fetch. |
| 5 | 🔴 **CRITICAL** | Added vocabulary existence validation before save. |
| 6 | 🟠 **IMPORTANT** | Added CSRF documentation (Next.js Server Actions built-in). |
| 7 | 🟠 **IMPORTANT** | Added rate limiting (Upstash Redis with in-memory fallback). |
| 8 | 🟠 **IMPORTANT** | Added audit logging for save/unsave mutations. |
| 9 | 🟠 **IMPORTANT** | Removed pagination ceiling; validate against actual `totalPages` instead. |
| 10 | 🟠 **IMPORTANT** | Added 7 security tests $\rightarrow$ 35 tests total. |
| 11 | 🟠 **IMPORTANT** | Added Rollback Plan section. |
| 12 | 🟠 **IMPORTANT** | Added API contract update to Section 30. |
| 13 | 🟡 **MINOR** | Renamed `src/lib/vocabulary.ts` $\rightarrow$ `src/lib/queries/vocabulary.ts`. |
| 14 | 🟡 **MINOR** | Added `aria-live` for search results counter. |
| 15 | 🟡 **MINOR** | Added focus management when removing cards. |
| 16 | 🟡 **MINOR** | Documented seed data dependencies for E2E. |
| 17 | 🟡 **MINOR** | Clarified `savedAt` update behavior. |
| 18 | 🟡 **MINOR** | Documented `notes` + `isMastered` deferral. |
| 19 | 🟡 **MINOR** | Unified `PROJECT_STATE.md` naming (superseding `PROJECT_STATUS.md`). |
| 20 | 🟡 **MINOR** | Added `orderBy` for sentence context query. |

---

## 1. Phase Objective
Build the production-ready personal vocabulary learning system for **ReadToImprove**, connecting the Phase 6 interactive bilingual reading experience with the user account persistence layer.

Learners (IELTS/TOEFL students, professionals, academics) must be able to:
- **Save / Unsave Vocabulary from Reader**: Turn reading into active vocabulary acquisition.
- **Display Live Saved State in Reader**: Accurate, zero $N+1$.
- **Personal Word Bank Management (`/word-bank`)**: Browse, search, filter, pronounce, review context, remove.
- **Contextual Retention**: Preserve original article + sentence context.
- **Multi-Dimensional Exploration**: Search EN/VI, filter CEFR A1–C2, paginate.
- **Strict Authorization & Data Isolation**: Session-derived ownership only.
- **Accessible & Responsive UX**: WCAG 2.1 AA, mobile-to-desktop.

---

## 2. Current Repository Findings

| Component | Path | Status |
| :--- | :--- | :--- |
| **Prisma Schema** | `prisma/schema.prisma` | `UserSavedVocabulary` exists with `@@unique([userId, vocabularyId])`, `@@index([userId])`. |
| **Global Vocabulary** | `prisma/schema.prisma` | `Vocabulary` has `word`, `normalizedLemma`, `ipa`, `pos`, `meaningVi`, `exampleEn`, `exampleVi`, `cefrLevel`, `audioUrl`. |
| **Authentication** | `src/lib/auth.ts`, `src/lib/security.ts` | JWT session via `jose`. `auth()` + `requireAuth()`. |
| **Server Actions** | `src/lib/actions/auth.ts`, `admin.ts` | Established `ActionResult<T>` pattern. |
| **Article Reader** | `src/app/(public)/articles/[slug]/page.tsx` | Single query for article + sentences + vocab. |
| **Vocabulary Popover** | `src/components/reader/vocabulary-popover.tsx` | "Lưu từ" button marked deferred. |
| **UI Primitives** | `src/components/ui/`, `src/components/public/` | `Button`, `Badge`, `CefrBadge`, `Pagination`, `SearchBar`, `EmptyState`, `CefrSelector`. |
| **Header** | `src/components/common/header.tsx` | Session-aware. Ready for "Sổ từ vựng" link. |

---

## 3. Existing Architecture Reused
- **Session Layer**: `auth()` + `requireAuth()` (no new auth).
- **Data Access**: Singleton `prisma` from `src/lib/prisma.ts`.
- **Server Actions**: Extends `src/lib/actions/vocabulary.ts` using `ActionResult<T>`.
- **UI Components**: `Pagination`, `CefrBadge`, `Button`, Lucide icons.
- **Validation**: Zod.
- **Public Visibility**: `getPublicArticleWhereClause()` from Phase 5.

---

## 4. Database Analysis

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

### Relational Integrity:
- **PK**: `id String @id @default(cuid())`
- **FK**: `userId` $\rightarrow$ `User.id` (Cascade), `vocabularyId` $\rightarrow$ `Vocabulary.id` (Cascade)
- **Unique**: `@@unique([userId, vocabularyId])` $\rightarrow$ atomic upsert safe
- **Index**: `@@index([userId])` $\rightarrow$ fast per-user query

---

## 5. Migration Decision

### 5.1 UserSavedVocabulary — NO MIGRATION REQUIRED
Schema already satisfies Phase 7 persistence requirements. No changes to table structure.

### 5.2 [v1.1-FIX] NEW Migration Required: Trigram Index for Search
- **Vấn đề**: Prisma `contains` + `mode: 'insensitive'` $\rightarrow$ `ILIKE '%...%'` $\rightarrow$ full table scan (leading wildcard cannot use B-tree index).
- **Giải pháp**: Thêm `pg_trgm` extension + GIN index.
- **Migration file**: `prisma/migrations/YYYYMMDDHHMMSS_add_trigram_search/migration.sql`

```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for fast ILIKE '%...%' search
CREATE INDEX IF NOT EXISTS "Vocabulary_word_trgm_idx"
  ON "Vocabulary" USING GIN (word gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "Vocabulary_meaningVi_trgm_idx"
  ON "Vocabulary" USING GIN ("meaningVi" gin_trgm_ops);
```

Update `prisma/schema.prisma`:
```prisma
model Vocabulary {
  // ... existing fields

  @@index([word(ops: raw("gin_trgm_ops"))], type: Gin)
  @@index([meaningVi(ops: raw("gin_trgm_ops"))], type: Gin)
}
```

Verification after migration:
```sql
EXPLAIN ANALYZE
SELECT * FROM "Vocabulary"
WHERE word ILIKE '%sustain%';
-- Should show: Bitmap Index Scan on Vocabulary_word_trgm_idx
-- KHÔNG được show: Seq Scan
```

Rollback (nếu cần):
```sql
DROP INDEX IF EXISTS "Vocabulary_word_trgm_idx";
DROP INDEX IF EXISTS "Vocabulary_meaningVi_trgm_idx";
-- pg_trgm extension giữ lại (dùng chung)
```

---

## 6. Authentication Strategy

### 6.1 Server Components (`/word-bank`)
```typescript
const user = await requireAuth('/word-bank');
// → redirects to /login?returnUrl=%2Fword-bank nếu unauth
```

### 6.2 Server Actions
```typescript
const session = await auth();
if (!session?.user?.id) {
  return { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' };
}
const userId = session.user.id; // NEVER from client
```

### 6.3 Public Article Reader
```typescript
const session = await auth(); // passive
const isAuthenticated = !!session?.user?.id;
```

---

## 7. Authorization Strategy
- **Tenant Isolation**: Every read/write enforces `where: { userId: session.user.id }`.
- **Cross-User Protection**: User A cannot read/mutate User B's data (delete returns `count: 0`).
- **Global Content Protection**: Standard users never mutate `Vocabulary`; only the `UserSavedVocabulary` join entity is created or deleted.

---

## 8. [v1.1-FIX] Save / Unsave Semantics (Race-Free)

### 8.1 Removed: `toggleSaveVocabularyAction` ❌
- **Lý do**: Check-then-act race condition. Client phải biết `isSaved` state và gửi intent rõ ràng (`SAVE` hoặc `UNSAVE`).

### 8.2 Save Operation (`saveVocabularyAction`) — IDEMPOTENT
```typescript
'use server';

export async function saveVocabularyAction(
  input: { vocabularyId: string }
): Promise<ActionResult<{ isSaved: true; vocabularyId: string }>> {
  // 1. Authenticate
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = SaveVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ.' };
  }
  const { vocabularyId } = parsed.data;

  // 3. [v1.1-FIX] Rate limit
  const { success: rateLimitOk } = await rateLimit(`save:${userId}`);
  if (!rateLimitOk) {
    return { success: false, error: 'RATE_LIMITED', message: 'Vui lòng thử lại sau.' };
  }

  // 4. [v1.1-FIX] Validate vocabulary exists BEFORE upsert
  const vocab = await prisma.vocabulary.findUnique({
    where: { id: vocabularyId },
    select: { id: true },
  });
  if (!vocab) {
    return { success: false, error: 'NOT_FOUND', message: 'Từ vựng không tồn tại.' };
  }

  // 5. Atomic upsert
  try {
    await prisma.userSavedVocabulary.upsert({
      where: {
        userId_vocabularyId: { userId, vocabularyId },
      },
      create: { userId, vocabularyId },
      // [v1.1-IMPROVE] Keep original savedAt, only touch if re-saved after unsave
      update: {},
    });

    // 6. [v1.1-IMPROVE] Audit log (fire-and-forget)
    void auditLog({
      userId,
      action: 'SAVE_VOCABULARY',
      entityType: 'UserSavedVocabulary',
      entityId: vocabularyId,
    });

    // 7. Revalidate (tag-based)
    revalidateTag(`word-bank-${userId}`);
    // Article page: rely on optimistic UI, no revalidate needed

    return { success: true, data: { isSaved: true, vocabularyId } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        // Already saved (unique conflict on race) → treat as success
        return { success: true, data: { isSaved: true, vocabularyId } };
      }
      if (e.code === 'P2003') {
        return { success: false, error: 'INVALID_VOCAB', message: 'Từ vựng không hợp lệ.' };
      }
    }
    captureError(e, { userId, vocabularyId, action: 'save' });
    return { success: false, error: 'INTERNAL', message: 'Có lỗi xảy ra.' };
  }
}
```

### 8.3 Unsave Operation (`unsaveVocabularyAction`) — IDEMPOTENT
```typescript
export async function unsaveVocabularyAction(
  input: { vocabularyId: string }
): Promise<ActionResult<{ isSaved: false; vocabularyId: string }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' };
  }
  const userId = session.user.id;

  const parsed = UnsaveVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'INVALID_INPUT', message: 'Dữ liệu không hợp lệ.' };
  }
  const { vocabularyId } = parsed.data;

  // Rate limit
  const { success: rateLimitOk } = await rateLimit(`unsave:${userId}`);
  if (!rateLimitOk) {
    return { success: false, error: 'RATE_LIMITED', message: 'Vui lòng thử lại sau.' };
  }

  try {
    // Idempotent: deleteMany returns count: 0 if nothing to delete
    const result = await prisma.userSavedVocabulary.deleteMany({
      where: { userId, vocabularyId }, // userId from session = tenant isolation
    });

    if (result.count > 0) {
      void auditLog({
        userId,
        action: 'UNSAVE_VOCABULARY',
        entityType: 'UserSavedVocabulary',
        entityId: vocabularyId,
      });
    }

    revalidateTag(`word-bank-${userId}`);

    return { success: true, data: { isSaved: false, vocabularyId } };
  } catch (e) {
    captureError(e, { userId, vocabularyId, action: 'unsave' });
    return { success: false, error: 'INTERNAL', message: 'Có lỗi xảy ra.' };
  }
}
```

### 8.4 Client Contract
```typescript
// In VocabularyPopover:
const handleToggle = async () => {
  if (!isAuthenticated) {
    showLoginPrompt();
    return;
  }

  const wasSaved = isSaved;
  setIsSaved(!wasSaved); // optimistic

  const action = wasSaved ? unsaveVocabularyAction : saveVocabularyAction;
  const result = await action({ vocabularyId });

  if (!result.success) {
    setIsSaved(wasSaved); // rollback
    toast.error(result.message);
  }
};
```
> **Key**: Client decides save vs unsave based on current state. Server never toggles blindly. No race condition.

### 8.5 Flow Diagram
```text
┌────────────────────────────────────────────────────────────┐
│ User clicks "Lưu từ" / "Bỏ lưu"                           │
└────────────────────────┬───────────────────────────────────┘
                         │
                         ▼
            Is user authenticated?
                    /        \
                   NO        YES
                   /          \
                  ▼            ▼
    Show login prompt      Client sends EXPLICIT intent
    with returnUrl         (based on current isSaved state)
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              SAVE ACTION    UNSAVE ACTION
                    │             │
                    ▼             ▼
          Rate limit check    Rate limit check
                    │             │
                    ▼             ▼
          Validate vocab       deleteMany
              exists           where {userId, vocabId}
                    │             │
                    ▼             ▼
          prisma.upsert       Returns count: 0|1
          (atomic, safe)      (idempotent)
                    │             │
                    └──────┬──────┘
                           ▼
              auditLog + revalidateTag
                           │
                           ▼
              Return { isSaved: bool }
```

---

## 9. Article Reader Integration (Zero N+1)

### 9.1 Single Batch Query on Article Load
```typescript
// src/app/(public)/articles/[slug]/page.tsx
const session = await auth();
let initialSavedVocabIds: string[] = [];

if (session?.user?.id) {
  const articleVocabIds = Array.from(
    new Set(
      article.sentences.flatMap((s) =>
        s.vocabularies.map((v) => v.vocabulary?.id).filter(Boolean)
      )
    )
  ) as string[];

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
- **Performance**: Exactly 1 indexed query (`@@index([userId])` + PK on `vocabularyId`).

### 9.2 Client State
- `BilingualSentenceList` holds `savedVocabIds: Set<string>` initialized from props.
- On toggle: optimistic update $\rightarrow$ server action $\rightarrow$ rollback on failure.
- Multi-tab sync: Accepted as eventual consistency (documented limitation). Refetch on tab focus via `router.refresh()`.

---

## 10. [v1.1-FIX] Word Bank Architecture (`/word-bank`)

### 10.1 Route
```text
/word-bank
```

### 10.2 Layout
```text
Header (Session-aware with "Sổ từ vựng" active link)
   │
   ▼
Word Bank Page (src/app/(public)/word-bank/page.tsx)
   │
   ├─ Breadcrumb & Title ("Sổ từ vựng cá nhân")
   │     └─ Total counter badge
   │
   ├─ Filter & Search Bar
   │     ├─ Search Input (EN headword + VI meaning)
   │     └─ CEFR Pills (All, A1...C2)
   │
   ├─ Content
   │     ├─ Empty State (no saved words / filter yields 0)
   │     └─ Card Grid (responsive)
   │           └─ WordBankCard
   │                 ├─ Header: word, IPA, audio, CEFR badge, POS
   │                 ├─ Body: Vietnamese meaning
   │                 ├─ Context: article sentence + article link
   │                 └─ Footer: saved date + remove button
   │
   └─ Server-Side Pagination (reuse src/components/public/pagination.tsx)
```

### 10.3 [v1.1-FIX] N+1-Free Data Fetching
- **Problem in v1.0**: `include: { vocabulary: { include: { sentenceInstances: { take: 1 } } } }` $\rightarrow$ ~37 queries for 12 cards.
- **Solution**: Batch fetch + in-memory grouping.

```typescript
// src/lib/queries/vocabulary.ts
export async function getWordBankPage(params: {
  userId: string;
  q?: string;
  cefr?: CefrLevel | 'ALL';
  page: number;
  limit?: number;
}) {
  const { userId, q, cefr, page, limit = 12 } = params;

  const where: Prisma.UserSavedVocabularyWhereInput = {
    userId,
    ...(cefr && cefr !== 'ALL' ? { vocabulary: { cefrLevel: cefr } } : {}),
    ...(q
      ? {
          vocabulary: {
            ...(cefr && cefr !== 'ALL' ? { cefrLevel: cefr } : {}),
            OR: [
              { word: { contains: q, mode: 'insensitive' } },
              { meaningVi: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [total, savedItems] = await Promise.all([
    prisma.userSavedVocabulary.count({ where }),
    prisma.userSavedVocabulary.findMany({
      where,
      include: { vocabulary: true }, // 1 query, 1 JOIN
      orderBy: { savedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // Batch fetch context sentences (1 extra query for all vocabIds)
  const vocabIds = savedItems.map((s) => s.vocabularyId);
  const contexts = vocabIds.length
    ? await prisma.sentenceVocabulary.findMany({
        where: { vocabularyId: { in: vocabIds } },
        include: {
          sentence: {
            select: {
              textEn: true,
              textVi: true,
              orderIndex: true,
              article: { select: { slug: true, titleEn: true } },
            },
          },
        },
        orderBy: { sentence: { orderIndex: 'asc' } }, // [v1.1-IMPROVE]
      })
    : [];

  // Group by vocabularyId, take FIRST (lowest orderIndex) per vocab
  const contextByVocab = new Map<string, (typeof contexts)[number]>();
  for (const c of contexts) {
    if (!contextByVocab.has(c.vocabularyId)) {
      contextByVocab.set(c.vocabularyId, c);
    }
  }

  const items = savedItems.map((s) => ({
    ...s,
    context: contextByVocab.get(s.vocabularyId) ?? null,
  }));

  return {
    items,
    total,
    totalPages: Math.ceil(total / limit),
    page,
    limit,
  };
}
```
> **Total queries per page**: Exactly **3** (`count`, `savedItems`, `contexts`) — constant regardless of card count.

---

## 11. [v1.1-FIX] Search Design

### 11.1 Input Validation
```typescript
export const WordBankQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Tối thiểu 2 ký tự')
    .max(100, 'Tối đa 100 ký tự')
    .optional()
    .transform((v) => v || undefined),
  cefr: z.union([z.nativeEnum(CefrLevel), z.literal('ALL')]).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
});
```

### 11.2 Query (Indexed via GIN Trigram)
```typescript
OR: [
  { word: { contains: q, mode: 'insensitive' } },        // GIN trigram index
  { meaningVi: { contains: q, mode: 'insensitive' } },   // GIN trigram index
]
```
- **Performance target**: p95 < 100ms with 10,000 vocab records.
- **Fallback**: If > 500ms $\rightarrow$ document ADR and evaluate Meilisearch in Phase 8/11.

---

## 12. Filter Design

### In-Scope
- **CEFR Level**: `ALL` | `A1` | `A2` | `B1` | `B2` | `C1` | `C2`
- **Search**: EN headword + VI meaning

### [v1.1-IMPROVE] Deferred (Explicitly Documented)
- `isMastered` toggle $\rightarrow$ Phase 9 (schema field exists, default `false`, no UI in Phase 7).
- `notes` editing $\rightarrow$ Phase 9 (schema field exists, no UI in Phase 7).
- Custom folders / tags $\rightarrow$ Phase 9+.

---

## 13. [v1.1-FIX] Pagination Strategy
- **Type**: Server-side offset pagination.
- **Default**: `limit = 12`.
- **Param**: `?page=1`.
- **Queries**: `Promise.all([findMany, count])`.
- **Validation**:
  ```typescript
  if (page < 1) page = 1;
  if (totalPages > 0 && page > totalPages) page = totalPages;
  // No arbitrary ceiling — validate against actual totalPages
  ```
- When `total = 0`: Render Empty State, do not render Pagination.
- Removed arbitrary 1,000 pages ceiling.

---

## 14. [v1.1-FIX] Cache & Revalidation

### 14.1 Route Config
```typescript
// /word-bank/page.tsx
export const dynamic = 'force-dynamic';
```

### 14.2 Tag-Based Revalidation
```typescript
// In page.tsx — wrap query with cache tag
import { unstable_cache } from 'next/cache';

const getCachedWordBank = unstable_cache(
  getWordBankPage,
  ['word-bank'],
  {
    tags: [`word-bank-${userId}`],
    revalidate: false, // only invalidated explicitly
  }
);
```
```typescript
// In Server Actions
revalidateTag(`word-bank-${userId}`); // invalidate ONLY this user's cache
```

### Benefits:
- Eliminates invalid `revalidatePath('/articles/[slug]')` pattern.
- Article Reader relies on optimistic UI — zero unnecessary revalidation.
- Multi-user safety: User A's save never invalidates User B's cache.

### 14.3 SEO
```typescript
export const metadata: Metadata = {
  title: 'Sổ từ vựng cá nhân | ReadToImprove',
  robots: { index: false, follow: false },
};
```

---

## 15. API & Server Action Contracts

### 15.1 `saveVocabularyAction`
- **File**: `src/lib/actions/vocabulary.ts`
- **Input**: `{ vocabularyId: string }` (CUID)
- **Auth**: Required (`auth()`)
- **Rate limit**: 30 req/min per user
- **Validate**: Zod + vocabulary existence check
- **Operation**: `prisma.userSavedVocabulary.upsert` with `update: {}`
- **Return**: `ActionResult<{ isSaved: true; vocabularyId: string }>`
- **Errors**: `UNAUTHORIZED` | `INVALID_INPUT` | `RATE_LIMITED` | `NOT_FOUND` | `INTERNAL`

### 15.2 `unsaveVocabularyAction`
- **Input**: `{ vocabularyId: string }`
- **Auth**: Required
- **Rate limit**: 30 req/min per user
- **Operation**: `prisma.userSavedVocabulary.deleteMany` (idempotent)
- **Return**: `ActionResult<{ isSaved: false; vocabularyId: string }>`

### 15.3 ~~`toggleSaveVocabularyAction`~~ REMOVED [v1.1-FIX]
- Removed to eliminate check-then-act race condition. Client picks explicit action based on current state.

---

## 16. [v1.1-IMPROVE] Component Architecture

```text
src/
├── app/(public)/
│   ├── articles/[slug]/page.tsx      [MODIFY: batch saved-state]
│   └── word-bank/
│       ├── page.tsx                   [NEW: authenticated page]
│       ├── loading.tsx                [NEW: skeleton]
│       └── error.tsx                  [NEW: boundary]
│
├── components/
│   ├── common/header.tsx              [MODIFY: add nav link]
│   ├── reader/
│   │   ├── bilingual-sentence-list.tsx [MODIFY: savedVocabIds Set]
│   │   ├── bilingual-sentence-item.tsx [MODIFY: pass state]
│   │   └── vocabulary-popover.tsx     [MODIFY: activate save button]
│   └── word-bank/
│       ├── word-bank-header.tsx       [NEW]
│       ├── word-bank-filter-bar.tsx   [NEW]
│       ├── word-bank-card.tsx         [NEW]
│       └── word-bank-empty.tsx        [NEW]
│
├── lib/
│   ├── actions/vocabulary.ts          [NEW: mutations]
│   ├── queries/vocabulary.ts          [NEW: data access]  ← [v1.1-IMPROVE] renamed
│   ├── rate-limit.ts                  [NEW: Upstash wrapper with in-memory fallback]
│   ├── audit-log.ts                   [NEW: audit helper]
│   └── errors.ts                      [EXISTING: captureError]
│
└── validations/
    └── word-bank.ts                   [NEW: Zod schemas]

prisma/
└── migrations/
    └── YYYYMMDDHHMMSS_add_trigram_search/migration.sql  [NEW]
```

---

## 17. Context Information Retention
- See Section 10.3: Batch fetch + in-memory group.
- Fallback: If no `sentenceInstance` exists $\rightarrow$ use `vocabulary.exampleEn` / `exampleVi`.
- UI Display:
  - *"Ngữ cảnh trong bài: [English sentence]"*
  - Link: *"Xem trong bài viết: [Article Title]"* $\rightarrow$ `/articles/[slug]`

---

## 18. [v1.1-IMPROVE] Accessibility Strategy (WCAG 2.1 AA)

### Semantic HTML
`<main>`, `<section>`, `<article>` cards, native `<button>`.

### ARIA Attributes
- Save button: `aria-label="Lưu từ vựng {word} vào Sổ từ vựng"` / `aria-label="Bỏ lưu từ vựng {word}"`.
- `aria-pressed={isSaved}` on toggle.
- Search input: `<label>` + `aria-describedby` for helper hint.
- **[v1.1-IMPROVE] Search results counter**:
  ```html
  <div aria-live="polite" aria-atomic="true">{total} từ vựng</div>
  ```

### Keyboard Navigation
- Full Tab sequence: Search $\rightarrow$ Filters $\rightarrow$ Audio buttons $\rightarrow$ Remove buttons $\rightarrow$ Pagination.
- High visibility focus: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.

### [v1.1-IMPROVE] Focus Management on Remove
When removing a card:
1. If cards remain: Focus moves to the next card (or previous if removing the last card).
2. If all cards are removed: Focus moves to the Empty State heading.
3. Screen-reader announcement: `aria-live="polite"` $\rightarrow$ *"Đã xóa từ vựng. Còn X từ."*

```typescript
const handleRemove = async (vocabId: string, cardIndex: number) => {
  await unsaveVocabularyAction({ vocabularyId: vocabId });
  const nextIndex = Math.min(cardIndex, remainingCount - 1);
  if (nextIndex >= 0) {
    cardRefs.current[nextIndex]?.focus();
  } else {
    emptyStateRef.current?.focus();
  }
};
```

### No Color-Only Information
Saved state: Icon change (filled bookmark $\leftrightarrow$ outline) + text (*"Đã lưu"* / *"Lưu từ"*).

---

## 19. Responsive Strategy
- **Mobile (<640px)**: 1 column, full-width search, $44 \times 44$px touch targets.
- **Tablet (640–1024px)**: `grid-cols-1 sm:grid-cols-2`.
- **Desktop (>1024px)**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

---

## 20. [v1.1-IMPROVE] Security Analysis

### 20.1 Session Forgery Prevention
JWT validated server-side. Mutations rely on `session.user.id` only.

### 20.2 CSRF Protection
Next.js Server Actions have built-in CSRF protection:
- Origin header check (must match host).
- SameSite cookies.
- POST-only enforcement.

### 20.3 Rate Limiting
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { checkRateLimit } from '@/lib/security';

// In production with Upstash credentials:
// Use Upstash sliding window (30 req / 1 min).
// In local/test environment without Upstash:
// Seamless fallback to in-memory sliding window limiter.
```

### 20.4 Audit Logging
```typescript
// src/lib/audit-log.ts
export async function auditLog(entry: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entityType,
        entityId: entry.entityId,
        details: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}
```

### 20.5 Input Validation
Zod at every boundary. Search: max 100 chars, trimmed. CUID format check for `vocabularyId`.

### 20.6 No Private Route Leakage
`/word-bank` behind `requireAuth()`, `robots.txt` disallow, `<meta name="robots" content="noindex,nofollow">`.

### 20.7 Multi-Tab Consistency [v1.1-IMPROVE]
- **Known limitation**: Optimistic UI in tab A does not sync to tab B until refetch.
- **Mitigation**: On window focus $\rightarrow$ refetch via `router.refresh()`.

---

## 21. Performance Analysis

| Metric | Target | Strategy |
| :--- | :--- | :--- |
| **Word Bank page load** | < 500ms server | 3 queries (`count` + `findMany` + `contexts`) |
| **Search p95** | < 100ms | GIN trigram index |
| **Save/unsave action** | < 200ms | Atomic `upsert` / `deleteMany` |
| **Article reader saved state** | 1 query | Batch `IN` filter |
| **Client bundle** | < 20KB added | RSC-first, minimal client islands |

Scale targets validated: 10 / 100 / 1,000 / 10,000 saved words per user.

---

## 22. [v1.1-FIX] Detailed Test Plan (`scripts/verify-word-bank.ts`) — 35 Tests

### Authentication & Authorization (TC-WB-01 $\rightarrow$ 04)
- `TC-WB-01`: Unauth visitor $\rightarrow$ redirected to `/login?returnUrl=/word-bank`.
- `TC-WB-02`: Auth user can query own data.
- `TC-WB-03`: Server actions derive `userId` from session (reject spoofed `userId`).
- `TC-WB-04`: User A cannot enumerate/read User B's saved vocab.

### Save Functionality (TC-WB-05 $\rightarrow$ 09)
- `TC-WB-05`: Save creates record with correct `userId`.
- `TC-WB-06`: Duplicate save prevented via unique constraint + `upsert`.
- `TC-WB-07`: Save nonexistent `vocabId` $\rightarrow$ `NOT_FOUND`.
- `TC-WB-08`: Save preserves global `Vocabulary` integrity.
- `TC-WB-09`: Unauth save $\rightarrow$ `UNAUTHORIZED`.

### Unsave Functionality (TC-WB-10 $\rightarrow$ 13)
- `TC-WB-10`: Unsave deletes record.
- `TC-WB-11`: Unsave non-saved word $\rightarrow$ no-op, `count: 0`.
- `TC-WB-12`: User A cannot delete User B's record.
- `TC-WB-13`: Unsave does not cascade to `Vocabulary`.

### Article Reader Integration (TC-WB-14 $\rightarrow$ 17)
- `TC-WB-14`: Reader identifies unsaved vocab.
- `TC-WB-15`: Reader identifies saved vocab (batch).
- `TC-WB-16`: Unauth reader $\rightarrow$ 0 extra queries.
- `TC-WB-17`: Batch query, no $N+1$ (verify via query counter).

### Word Bank Queries & Filtering (TC-WB-18 $\rightarrow$ 23)
- `TC-WB-18`: Order by `savedAt DESC`.
- `TC-WB-19`: Search by EN headword (case-insensitive via trigram index).
- `TC-WB-20`: Search by VI meaning (case-insensitive via trigram index).
- `TC-WB-21`: CEFR filter.
- `TC-WB-22`: Combined search + CEFR.
- `TC-WB-23`: Pagination computes `totalPages`, `skip`, `take` correctly.

### Data Retention & Context (TC-WB-24 $\rightarrow$ 25)
- `TC-WB-24`: Context preserved (article + sentence).
- `TC-WB-25`: Fallback to `vocabulary.example` when no sentence instance exists.

### SEO & Accessibility (TC-WB-26 $\rightarrow$ 27)
- `TC-WB-26`: Metadata `robots: { index: false, follow: false }`.
- `TC-WB-27`: Empty state renders guidance + CTA.

### [v1.1-FIX] Security Tests (TC-SEC-01 $\rightarrow$ 07) — NEW
- `TC-SEC-01`: XSS in search query (`<script>alert(1)</script>`) $\rightarrow$ escaped/rendered inert.
- `TC-SEC-02`: SQL injection in search (`'; DROP TABLE--`) $\rightarrow$ Prisma parameterizes, zero effect.
- `TC-SEC-03`: Extremely long input (> 10,000 chars) $\rightarrow$ rejected by Zod (max 100).
- `TC-SEC-04`: Concurrent saves ($10 \times$ `Promise.all`) $\rightarrow$ no duplicate, no race error.
- `TC-SEC-05`: Rate limit exceeded $\rightarrow$ returns `RATE_LIMITED`.
- `TC-SEC-06`: Pagination boundary (`page=0`, `page=-1`, `page=999999999`) $\rightarrow$ clamped safely.
- `TC-SEC-07`: CSRF validation $\rightarrow$ Server Action rejects invalid Origin.

### DTO Leakage (TC-SEC-08)
- `TC-SEC-08`: No Prisma credentials/DB URLs in client DTO boundaries.

> **Total**: **35 tests**.

---

## 23. Browser E2E Verification Plan

### [v1.1-IMPROVE] Seed Data Dependencies
Required seeds (from `prisma/seed.ts`):
- User: `user@example.com`
- Article slug: `clean-energy-microgrids-urban-resilience`
- Vocabulary: `sustainable` (CEFR: B2)

### E2E Flow:
1. **Login**: Sign in as `user@example.com`.
2. **Reader**:
   - Open `/articles/clean-energy-microgrids-urban-resilience`.
   - Open popover on `"sustainable"`.
   - Verify initial state: `☆ Lưu từ`.
   - Click $\rightarrow$ verify transitions to `✓ Đã lưu`.
3. **Word Bank**:
   - Click `Sổ từ vựng` in header $\rightarrow$ `/word-bank`.
   - Verify card with CEFR badge, IPA, VI meaning, article context.
   - Click audio $\rightarrow$ verify trigger.
   - Search `"sustainable"` $\rightarrow$ filter works.
   - Filter CEFR `B2` $\rightarrow$ visible; `C1` $\rightarrow$ empty state.
   - Click `Xóa khỏi sổ từ` $\rightarrow$ verify card removed + focus management.
4. **Reader Sync**: Back to article $\rightarrow$ popover shows `☆ Lưu từ`.
5. **Mobile Viewport**: $375 \times 667$ $\rightarrow$ no horizontal overflow, touch targets $\ge 44$px.
6. **Multi-Tab**: Open 2 tabs, save in A, focus B $\rightarrow$ verify refetch.

---

## 24. Full Regression Plan

```bash
npx tsx scripts/verify-db.ts
npx tsx scripts/verify-auth.ts
npx tsx scripts/verify-admin.ts
npx tsx scripts/verify-public.ts
npx tsx scripts/verify-reader.ts
npx tsx scripts/verify-word-bank.ts   # Phase 7 (35 tests)
npm run typecheck
npm run lint
npm run build
```

---

## 25. Edge Cases & Handling
- **Unauth save**: Login prompt with `returnUrl`.
- **Concurrent saves**: Unique constraint + upsert (verified `TC-SEC-04`).
- **Admin deletes Vocabulary**: Cascade deletes `UserSavedVocabulary` (schema-level).
- **No sentence context**: Fallback to `exampleEn`/`exampleVi`.
- **Very long VI definition**: `break-words` + clamped lines.
- **Network failure on save**: Optimistic rollback + toast.
- **[v1.1-FIX] Search > 100 chars**: Zod rejects with friendly message.
- **[v1.1-FIX] `page=0` or negative**: Clamp to 1.
- **[v1.1-FIX] `page > totalPages`**: Clamp to `totalPages`.
- **[v1.1-FIX] Rate limit exceeded**: `RATE_LIMITED` + toast.

---

## 26. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **$N+1$ in Reader** | Latency | Batch `IN` query (Section 9) |
| **$N+1$ in Word Bank** | Latency | Batch context fetch (Section 10.3) |
| **Cross-user leakage** | Privacy | `where: { userId: session.user.id }` enforced everywhere |
| **Hydration mismatch** | UI flicker | Server-rendered `initialSavedVocabIds` |
| **Search perf degradation** | Slow UX | GIN trigram index (Section 5.2) |
| **Race condition on save** | Data corruption | Removed toggle; explicit intent (Section 8) |
| **Rate limit bypass** | DoS | Sliding window rate limit (Section 20.3) |
| **Multi-tab desync** | UX confusion | Refetch on window focus (documented limitation) |

---

## 27. [v1.1-FIX] Rollback Plan

### Pre-Phase 7
```bash
git tag phase-07-start
git checkout -b feat/phase-07
# Snapshot DB (trigram migration):
# pg_dump $DATABASE_URL > backup/pre-phase-07.sql
```

### If Phase 7 Fails
```bash
git reset --hard phase-07-start
# Rollback trigram migration nếu cần:
# DROP INDEX IF EXISTS "Vocabulary_word_trgm_idx";
# DROP INDEX IF EXISTS "Vocabulary_meaningVi_trgm_idx";
```

### Post-Phase 7 Success
```bash
git tag phase-07-complete
git checkout main
git merge feat/phase-07
git push origin main --tags
```
> **Rule**: KHÔNG BAO GIỜ chạy `prisma migrate reset` trên bất kỳ database nào có dữ liệu.

---

## 28. Acceptance Criteria (Definition of Done)
- [ ] Authenticated user can save/unsave from Reader popover.
- [ ] Unauth users prompted to login.
- [ ] Duplicate saves prevented (unique constraint).
- [ ] Reader displays accurate live state, zero $N+1$.
- [ ] `/word-bank` protected by `requireAuth()`.
- [ ] Word Bank sorted `savedAt DESC`.
- [ ] EN + VI search works.
- [ ] CEFR filter works.
- [ ] Cards display: Headword, IPA, POS, audio, CEFR, meaning, context.
- [ ] Remove from Word Bank works with focus management.
- [ ] User A cannot access User B data.
- [ ] Empty state + skeleton loading.
- [ ] Header "Sổ từ vựng" link (authenticated only).
- [ ] 35 automated tests pass 100%.
- [ ] All regression suites pass 100%.
- [ ] `typecheck`, `lint`, `build` $\rightarrow$ 0 errors.
- [ ] Browser E2E verification completes.
- [ ] `docs/phases/PHASE_07_REPORT.md` generated.
- [ ] `docs/PROJECT_STATE.md` updated.
- [ ] Git commit on clean tree.
- [ ] Status $\rightarrow$ `WAIT`.

---

## 29. Implementation Sequence

```text
Step 01: Create trigram migration + update schema.prisma
Step 02: Run migration locally + verify with EXPLAIN ANALYZE
Step 03: Create Zod schemas (src/validations/word-bank.ts)
Step 04: Implement rate-limit + audit-log helpers
Step 05: Implement Server Actions (src/lib/actions/vocabulary.ts)
Step 06: Implement queries (src/lib/queries/vocabulary.ts)
Step 07: Update Article Reader (batch saved-state)
Step 08: Update Reader Components (List, Item, Popover)
Step 09: Update Header (nav link)
Step 10: Create Word Bank UI components
Step 11: Implement Word Bank route pages
Step 12: Build verification suite (35 tests)
Step 13: Run full regression
Step 14: Browser E2E verification
Step 15: Senior code review + PHASE_07_REPORT.md
Step 16: Update PROJECT_STATE.md
Step 17: Git commit + status → WAIT
```

---

## 30. [v1.1-FIX] Files to Create & Modify

### NEW
1. `src/validations/word-bank.ts`
2. `src/lib/actions/vocabulary.ts`
3. `src/lib/queries/vocabulary.ts` (renamed from `vocabulary.ts`)
4. `src/lib/rate-limit.ts`
5. `src/lib/audit-log.ts`
6. `src/components/word-bank/word-bank-card.tsx`
7. `src/components/word-bank/word-bank-filter-bar.tsx`
8. `src/components/word-bank/word-bank-empty.tsx`
9. `src/app/(public)/word-bank/page.tsx`
10. `src/app/(public)/word-bank/loading.tsx`
11. `src/app/(public)/word-bank/error.tsx`
12. `scripts/verify-word-bank.ts` (35 tests)
13. `prisma/migrations/20260913130000_add_trigram_search/migration.sql`
14. `docs/phases/PHASE_07_IMPLEMENTATION_PLAN.md` (this document)

### MODIFY
1. `prisma/schema.prisma` (add GIN indexes to Vocabulary)
2. `src/app/(public)/articles/[slug]/page.tsx`
3. `src/components/reader/bilingual-sentence-list.tsx`
4. `src/components/reader/bilingual-sentence-item.tsx`
5. `src/components/reader/vocabulary-popover.tsx`
6. `src/components/common/header.tsx`
7. `docs/PROJECT_STATE.md` (unified naming)
8. `IMPLEMENTATION_PLAN.md` (phase roadmap)

---

## 31. [v1.1-FIX] Explicit Out-of-Scope
- **Phase 08**: Global article search, catalog autocomplete.
- **Phase 09**: Reading history, favorites, spaced-repetition flashcards.
- **Phase 10**: Lighthouse / Web Vitals optimization.
- **Paid TTS API**: Reuse Web Speech API + existing `audioUrl`.
- **Custom Folders/Decks**: Multi-folder taxonomy $\rightarrow$ Phase 9+.
- **`isMastered` toggle**: Schema field exists (default `false`), no UI in Phase 7 $\rightarrow$ Phase 9.
- **`notes` editing**: Schema field exists, no UI in Phase 7 $\rightarrow$ Phase 9.
- **Multi-tab real-time sync**: Eventual consistency only; refetch on focus.
- **Sort options beyond `savedAt DESC`**: Phase 9.

---

## 32. Dependency Additions

| Package | Purpose | Justification |
| :--- | :--- | :--- |
| `@upstash/ratelimit` | Rate limiting | Serverless-friendly, Redis-backed sliding window |
| `@upstash/redis` | Redis client | Required by ratelimit (with in-memory fallback for local) |
| `pg_trgm` (Postgres ext) | Trigram search | Native PostgreSQL extension, no runtime dependency |

> **Note**: No new client-side UI dependencies — all components reuse existing Tailwind and Radix/shadcn primitives.

---

## END OF PHASE 07 PLAN v1.1
- **Status**: `READY FOR APPROVAL`
- **Next Step**: `WAIT` for user `APPROVE PHASE 7` $\rightarrow$ proceed to `IMPLEMENT` (Step 01)
