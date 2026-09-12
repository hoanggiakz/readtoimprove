# PHASE 06 — IMPLEMENTATION PLAN

```text
PHASE: 06
STATUS: WAIT
CURRENT DECISION: AWAITING_APPROVAL
```

---

## 1. Phase Objective
Design and implement the production-ready **Article Reading Experience** for **ReadToImprove**.
Transform the public article route:
```text
/articles/[slug]
```
into an immersive, distraction-free, bilingual learning environment. Empower Vietnamese English learners (IELTS/TOEFL candidates, university students, and professionals) to:
- Read international news articles sentence-by-sentence in authentic English.
- Inspect aligned Vietnamese translations alongside each sentence.
- Toggle translation visibility (`Show all`, `Hover / Tap to reveal`, `Hide / English only`) with persistent local preference.
- View precise, offset-based vocabulary highlights color-coded by CEFR difficulty (`B1`, `B2`, `C1`, `C2`).
- Interact with highlighted words to inspect phonetic IPA, part of speech, Vietnamese definitions, and contextual example sentences via accessible popovers without leaving the article.
- Track reading progress visually through an unobtrusive progress indicator (0%–100%).
- Adjust reading typography (font size calibration: small, medium, large, extra-large) with persistent settings.
- Experience high-performance, accessible reading across mobile, tablet, and desktop devices while preserving strict public visibility rules.

---

## 2. Repository State Discovered
A comprehensive audit of the repository establishes the baseline:
1. **Git State**:
   - Working tree is clean on branch `master`.
   - Phase 5 commit `fbaa6e7` (`feat(phase-05): implement public discovery, content browsing, search foundation, and 20-test verification suite`) is the current `HEAD`.
2. **Database & Schema (`prisma/schema.prisma`)**:
   - `Article` entity contains: `id`, `slug`, `titleEn`, `titleVi`, `excerptEn`, `excerptVi`, `sourceName`, `sourceUrl`, `originalPublishedAt`, `thumbnailUrl`, `videoUrl`, `cefrLevel`, `status`, `publishedAt`, `scheduledAt`, `readingTimeMinutes`, `metaTitle`, `metaDescription`, `canonicalUrl`, `ogImage`.
   - `Sentence` entity contains: `id`, `articleId`, `orderIndex`, `textEn`, `textVi`, with unique constraint `@@unique([articleId, orderIndex])`.
   - `SentenceVocabulary` contains: `id`, `sentenceId`, `vocabularyId`, `startOffset`, `endOffset`, `highlightedText`.
   - `Vocabulary` contains: `id`, `word`, `normalizedLemma`, `ipa`, `pos`, `meaningVi`, `exampleEn`, `exampleVi`, `cefrLevel`, `audioUrl`.
   - **Schema Assessment**: The existing schema completely satisfies all Phase 6 requirements. **NO DATABASE MIGRATION IS REQUIRED**.
3. **Public Route State**:
   - `src/app/(public)/articles/[slug]/page.tsx` currently provides a preliminary preview landing built in Phase 5. In Phase 6, this page will be upgraded into the full interactive bilingual reading experience.
4. **Verification Baseline**:
   - Database suite (`scripts/verify-db.ts`): 10/10 PASS
   - Auth suite (`scripts/verify-auth.ts`): 10/10 PASS
   - Admin CMS suite (`scripts/verify-admin.ts`): 20/20 PASS
   - Public Discovery suite (`scripts/verify-public.ts`): 20/20 PASS
   - Static Typecheck (`npm run typecheck`): 0 errors
   - ESLint (`npm run lint`): 0 errors, 0 warnings
   - Production Build (`npm run build`): 18/18 routes compiled

---

## 3. Phase 5 Dependency Verification
Phase 6 builds directly upon the Phase 5 public discovery layer:
- **Authoritative Where Clause**: `getPublicArticleWhereClause()` in `src/lib/articles.ts` guarantees that only published articles with `publishedAt <= currentServerTime` are returned.
- **Slug Resolution**: `getPublicArticleBySlug(slug)` strictly rejects unpublished, draft, pending-review, archived, and future-scheduled articles by returning `null`.
- **Shell & Navigation**: `src/components/common/header.tsx` provides brand navigation, theme toggle, and session indicators.
- **Dependency Status**: **100% Operational & Verified**.

---

## 4. Functional Scope
1. **Sentence-by-Sentence Bilingual Reader**:
   - Renders sentences deterministically sorted by `orderIndex ASC`.
   - English sentence text presented in high-legibility typography with sentence index identifier (`#01`, `#02`...).
   - Vietnamese translation paired with English, visually separated with subtle contrast and font styling.
   - Preserves exact English and Vietnamese text without altering character casing, punctuation, or formatting.
2. **Translation Visibility Modes**:
   - **All Visible (`ALL`)**: English sentence followed immediately by Vietnamese translation.
   - **Hover / Tap to Reveal (`HOVER`)**: Vietnamese translation blurred or collapsed until hovered or tapped.
   - **English Only (`HIDE`)**: Vietnamese translation hidden for immersive immersion practice.
   - Persistence in `localStorage` (`readtoimprove_translation_mode`).
3. **Offset-Based Vocabulary Highlighting**:
   - Tokenizes `textEn` using exact character indexes (`startOffset`, `endOffset`) from `SentenceVocabulary`.
   - Color-codes highlighted words with semantic CEFR badge badges/underlines (`B1`, `B2`, `C1`, `C2`).
   - Hardened against offset out-of-bounds, negative indexes, inverted ranges, and overlapping highlights.
4. **Interactive Vocabulary Popover**:
   - Triggered on click/tap of any highlighted vocabulary word.
   - Displays headword, phonetic transcription (`ipa`), part of speech (`pos`), CEFR level badge, Vietnamese definition (`meaningVi`), and contextual example sentence (`exampleEn`, `exampleVi`).
   - Accessible keyboard controls (Enter/Space to open, Esc to close, Tab to navigate).
   - Mobile-optimized: Centered popover/bottom modal ensuring no off-screen overflow.
5. **Reading Progress Tracker**:
   - Non-intrusive slim progress bar sticky at top of reader window.
   - Real-time scroll position calculation (0% to 100%).
   - Numerical percentage indicator in the reader control toolbar.
6. **Reader Customization Toolbar**:
   - Sticky bar underneath main header containing:
     - Translation mode selector (`Tất cả`, `Rê chuột`, `Ẩn`).
     - Font size adjuster (`A-`, `A`, `A+`, `A++` corresponding to 16px, 18px, 20px, 22px).
     - Progress indicator percentage.
7. **Article Header & Footer**:
   - Header: Breadcrumbs, category badges, CEFR badge, estimated reading time, publication date, source attribution, and featured thumbnail.
   - Footer: Educational Fair Use legal notice, source attribution link, and back-to-catalog action.

---

## 5. Non-Functional Scope
- **Performance**:
  - Main article page remains a React Server Component (RSC).
  - Single database query fetches article, categories, sentences, and vocabulary via Prisma `include`.
  - Zero client-side API round trips required to read article sentences or view vocabulary definitions.
  - Core Web Vitals target: FCP < 1.5s, TTI < 3.0s, Lighthouse Performance ≥ 90.
- **Accessibility**:
  - Strict compliance with **WCAG 2.1 Level AA**.
  - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-primary`).
  - Screen reader accessible attributes: `aria-expanded`, `aria-controls`, `aria-label`.
  - Contrast ratio exceeding 4.5:1 for all text and CEFR tokens.
- **Security**:
  - Zero use of `dangerouslySetInnerHTML`. Sliced text rendered directly as React nodes.
  - Server-side slug validation and visibility enforcement.
  - No internal/admin metadata exposed to client DOM.
- **SEO**:
  - Dynamic `generateMetadata()` providing canonical URL, OpenGraph, and JSON-LD `NewsArticle` schema.
  - 100% crawlable semantic HTML structure.

---

## 6. Route Strategy
- **Route**: `src/app/(public)/articles/[slug]/page.tsx`
- **Decision**: Upgrade the existing Phase 5 route directly.
- **Rationale**:
  - Maintains permanent, stable, and crawlable URLs (`/articles/[slug]`).
  - Eliminates redundant intermediate routes (e.g. `/articles/[slug]/read`).
  - Follows modern web application patterns (Medium, ReadToLead, Substack) where navigating to an article immediately provides the reading experience.

---

## 7. Article Data Model
The reader leverages existing fields from Prisma schema without any modifications:

| Model | Field | Purpose in Reader |
| :--- | :--- | :--- |
| **Article** | `slug` | Unique URL identifier |
| | `titleEn`, `titleVi` | Bilingual main title |
| | `excerptEn`, `excerptVi` | Bilingual article summary |
| | `sourceName`, `sourceUrl` | Source attribution & external link |
| | `thumbnailUrl` | Hero image |
| | `cefrLevel` | Article-level CEFR difficulty badge |
| | `publishedAt` | Publication date display |
| | `readingTimeMinutes` | Estimated reading duration |
| | `categories` | Multi-category taxonomy chips |
| **Sentence** | `orderIndex` | Deterministic sequential ordering |
| | `textEn` | Authentic English text |
| | `textVi` | Aligned Vietnamese translation |
| **SentenceVocabulary** | `startOffset` | Start character index in `textEn` |
| | `endOffset` | End character index in `textEn` |
| | `highlightedText` | Expected slice verification |
| **Vocabulary** | `word` | Headword |
| | `normalizedLemma` | Base lemma |
| | `ipa` | Phonetic transcription |
| | `pos` | Part of speech (`n`, `v`, `adj`, `adv`) |
| | `meaningVi` | Primary Vietnamese definition |
| | `exampleEn`, `exampleVi` | Contextual example and translation |
| | `cefrLevel` | Word-level CEFR difficulty |

---

## 8. Server / Client Architecture
To maximize performance and SEO while delivering interactive features, the architecture cleanly splits server and client responsibilities:

```text
src/app/(public)/articles/[slug]/page.tsx (SERVER COMPONENT)
  ├── 1. Fetches Article with Sentences and Vocabularies in 1 Query
  ├── 2. Enforces getPublicArticleWhereClause() (returns 404 if unpublished)
  ├── 3. Emits SEO Metadata (generateMetadata + JSON-LD)
  ├── 4. Renders Semantic Article Shell (<article>, <header>, <footer>)
  │
  └── Embeds Client Components for Interactivity:
        ├── <ReadingProgressBar /> (Client: Window scroll listener, slim bar)
        ├── <ReaderToolbar /> (Client: Translation toggle, font size buttons)
        └── <BilingualSentenceList /> (Client: Sentence loop, active states)
              └── <BilingualSentenceItem /> (Client: Sentence pair, highlight slicer)
                    └── <VocabularyPopover /> (Client: Accessible popover modal)
```

Client Components receive plain serializable view models (`Article`, `Sentence[]`, `Vocabulary[]`) and **never** import or call Prisma.

---

## 9. Sentence Rendering Strategy
- Sentences are rendered sequentially using the database order `orderIndex ASC`.
- Each sentence pair is rendered in a dedicated semantic container:
  - Container: `<div className="sentence-unit" id="sentence-N">`
  - English line: `<p className="font-sans font-medium text-foreground">` with responsive font sizing (`text-base`, `text-lg`, `text-xl`).
  - Vietnamese line: `<p className="font-serif italic text-muted-foreground">` styled with subtle indentation and dashed border to distinguish it from original text.
- Sentences support hover and active focus states: clicking or focusing a sentence highlights the container with an active accent border.

---

## 10. Translation Toggle Strategy
Readers can customize translation visibility via three distinct modes:
1. `'ALL'` (Mặc định): Vietnamese translations are always visible directly below the English sentences.
2. `'HOVER'`: Vietnamese translations are hidden with `opacity-0` and revealed smoothly on hover, focus, or tap.
3. `'HIDE'`: Vietnamese translations are completely hidden (`display: none`), allowing users to test their reading comprehension.

### 10.1 Hydration & Persistence
- Server Component renders translations visible by default (`'ALL'`) to ensure content is immediately accessible and indexable without JavaScript.
- On client mount (`useEffect`), the reader reads the stored preference from `localStorage.getItem('readtoimprove_translation_mode')`.
- When toggled, the state updates instantly and persists to `localStorage`.
- Zero hydration warning: CSS utility classes and mounted state guards prevent layout flickering.

---

## 11. Vocabulary Highlight Strategy
- Sentences contain zero or more `SentenceVocabulary` records.
- Text slicing algorithm:
  ```typescript
  // src/lib/sentence-slicer.ts
  export interface TextSlice {
    text: string;
    isHighlight: boolean;
    vocabulary?: VocabularyItem;
  }
  ```
- Steps:
  1. Sort all highlights for the sentence by `startOffset ASC`.
  2. Iterate through highlights, validating `0 <= startOffset < endOffset <= textEn.length`.
  3. Verify `h.startOffset >= currentIndex` to prevent overlapping highlight collision.
  4. Slice non-highlighted text `textEn.slice(currentIndex, h.startOffset)`.
  5. Slice highlighted token `textEn.slice(h.startOffset, h.endOffset)`.
  6. Append remaining trailing text.
- Highlighted tokens are rendered as interactive `<button>` elements with:
  - CEFR underline and background tint (`decoration-sky-400 bg-sky-50 dark:bg-sky-950/40`).
  - Screen reader label: `aria-label="Từ vựng: [word], cấp độ [level]"`
  - Keyboard accessible (`tabIndex={0}`, `role="button"`).

---

## 12. Offset Safety Strategy
To prevent any malformed highlight data from corrupting text rendering or throwing runtime exceptions:
1. **Bounds Validation**: If `startOffset < 0` or `endOffset > textEn.length` or `startOffset >= endOffset`, the highlight is safely discarded.
2. **Overlap Resolution**: If highlight $B$ has `startOffset < highlight A.endOffset`, highlight $B$ is safely skipped to preserve original text integrity.
3. **Fallback Guarantee**: If highlight slicing fails for any reason, the sentence falls back to rendering raw `textEn` without highlights, ensuring the reader **never** crashes.

---

## 13. Vocabulary Interaction Strategy (`VocabularyPopover`)
When a learner clicks, taps, or presses Enter on a highlighted token:
- Opens an accessible popover containing:
  - **Headword**: e.g., `sustainable`
  - **Phonetic IPA**: e.g., `/səˈsteɪnəbl/` with phonetic audio button indicator.
  - **Part of Speech**: e.g., `[adjective]`
  - **CEFR Badge**: e.g., `B2 — Upper Intermediate`
  - **Vietnamese Definition**: e.g., `bền vững, có thể duy trì lâu dài`
  - **Contextual Example Sentence**: Original example in English and Vietnamese translation.
- **Dismissal**: Closes on clicking outside, clicking the close button (`X`), or pressing `Escape`.
- **Focus Management**: Focus returns to the highlighted word upon popover closure.
- **Mobile Responsive**: On narrow screens (< 640px), popover centers smoothly on screen as a modal dialog with a backdrop to prevent horizontal clipping.

---

## 14. Reading Progress Strategy
- A lightweight client component `ReadingProgressBar` attaches a passive scroll listener to `window`.
- Calculates scroll percentage of the main article content container:
  $$\text{progress} = \min\left(100, \max\left(0, \frac{\text{scrollPosition} - \text{articleTop}}{\text{articleHeight} - \text{windowHeight}} \times 100\right)\right)$$
- Updates a top sticky bar with transition-all smoothing.
- Displays current percentage (e.g. `45%`) in the reader control bar.

---

## 15. Responsive Design
- **Mobile (< 768px)**:
  - Fluid padding (`px-4`).
  - Reader toolbar wraps cleanly into two compact rows.
  - Full-width sentence cards with comfortable touch targets ($\ge 44 \times 44$px for buttons).
  - Centered popover dialog prevents horizontal screen overflow.
- **Tablet (768px – 1024px)**:
  - Max reading width `max-w-3xl` (`~768px`) for optimal reading rhythm (60–80 characters per line).
  - Balanced typography and relaxed line height (`leading-relaxed`).
- **Desktop (> 1024px)**:
  - Max reading width `max-w-4xl` (`~896px`).
  - Sticky reader toolbar seamlessly pinned below the main navigation.

---

## 16. Accessibility (WCAG 2.1 AA)
- **Keyboard Navigation**: Reader is 100% operable without a mouse. Tab navigates between reading controls and vocabulary highlights; Space/Enter activates popovers; Escape dismisses popovers.
- **Visible Focus**: High-contrast outline rings on all interactive elements (`focus-visible:ring-2 focus-visible:ring-primary`).
- **Screen Reader Announcements**:
  - `aria-label` on toolbar buttons (e.g. `aria-label="Chuyển chế độ hiển thị bản dịch"`).
  - `aria-expanded` and `aria-haspopup="dialog"` on vocabulary tokens.
- **Visual Contrast**:
  - Light mode: Minimum 4.5:1 text-to-background contrast ratio.
  - Dark mode: Semantic slate/zinc dark tokens with emerald/sky/purple/rose CEFR accents.
  - Color is never the sole differentiator: highlights include text underlines.

---

## 17. SEO Strategy
- **Permanent Crawlable Route**: `/articles/[slug]`.
- **Metadata**: Generated server-side via `generateMetadata()`:
  - `<title>`: `[Article Title] | Đọc Báo Song Ngữ | ReadToImprove`
  - `<meta name="description">`: Article excerpt.
  - `<link rel="canonical">`: `https://readtoimprove.com/articles/[slug]`
  - OpenGraph: `og:title`, `og:description`, `og:image`, `og:type = 'article'`.
- **JSON-LD Structured Data**:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "...",
    "datePublished": "...",
    "author": { "@type": "Organization", "name": "..." }
  }
  ```
- **Unpublished Guard**: Draft, pending-review, archived, and future-scheduled articles return empty metadata and trigger Next.js `notFound()`.

---

## 18. Performance Strategy
- **Zero Client Data Fetching**: Complete article content, sentence order, and vocabulary highlights loaded server-side in 1 bounded Prisma query.
- **Lightweight Client Bundle**: Interactive components use minimal React hooks (`useState`, `useEffect`, `useCallback`). Zero heavy third-party animation or dictionary libraries.
- **Image Optimization**: Next.js `<Image>` with priority loading on hero banner.
- **NFR Compliance**: Target First Contentful Paint (FCP) < 1.5s, Time to Interactive (TTI) < 3.0s, Lighthouse Performance ≥ 90.

---

## 19. Security Strategy
- **No `dangerouslySetInnerHTML`**: All sentence text and vocabulary words are rendered as pure React text elements, eliminating XSS vectors.
- **Server Boundary Enforcement**: Client components only receive sanitized data props. Prisma Client is never imported into `"use client"` modules.
- **IDOR & Unpublished Protection**: Slug lookup queries `getPublicArticleWhereClause()`, preventing unauthorized access to unpublished or draft content via direct URL guessing.
- **Zero Internal Metadata Exposure**: Internal audit IDs, user IDs, and editorial notes are strictly stripped from public rendering.

---

## 20. Loading / Error / Not-Found States
- **Loading State**: `loading.tsx` in `src/app/(public)/articles/[slug]/` provides an animated article skeleton with title, badge placeholders, and sentence card pulses.
- **Not Found State**: Direct invocation of Next.js `notFound()` renders `not-found.tsx` when slug does not resolve or article is unpublished.
- **Error Boundary**: Runtime exceptions are caught by `error.tsx` displaying user-friendly recovery actions without leaking stack traces.
- **Content Integrity Fallback**: If a sentence has malformed highlights or missing vocabulary records, it renders the raw bilingual text cleanly without throwing.

---

## 21. Verification Strategy & Test Matrix (`scripts/verify-reader.ts`)
A dedicated automated test suite `scripts/verify-reader.ts` will test all 24 required reader specifications:

| Test ID | Objective | Expected Result |
| :--- | :--- | :--- |
| **TC-READER-01** | Public article loads through slug | Returns published article with sentences and categories |
| **TC-READER-02** | Reader only loads published articles | `status === PUBLISHED && publishedAt <= now` enforced |
| **TC-READER-03** | Future scheduled article cannot be read | Slug lookup returns `null` |
| **TC-READER-04** | Draft article cannot be read | Slug lookup returns `null` |
| **TC-READER-05** | Pending-review article cannot be read | Slug lookup returns `null` |
| **TC-READER-06** | Archived article cannot be read | Slug lookup returns `null` |
| **TC-READER-07** | Sentences returned in deterministic order | Strictly ordered by `orderIndex ASC` |
| **TC-READER-08** | English sentence content preserved exactly | Exact character match with stored `textEn` |
| **TC-READER-09** | Vietnamese translation preserved exactly | Exact character match with stored `textVi` |
| **TC-READER-10** | Sentence/article relation integrity | All sentences link to correct `articleId` |
| **TC-READER-11** | Vocabulary associations resolve correctly | Resolves `SentenceVocabulary` $\rightarrow$ `Vocabulary` relation |
| **TC-READER-12** | Highlights preserve exact offset slices | `textEn.slice(startOffset, endOffset) === highlightedText` |
| **TC-READER-13** | Out-of-bounds offsets handled safely | Negative or out-of-bounds offset safely discarded without crash |
| **TC-READER-14** | Overlapping highlight data safely resolved | Overlapping highlight skipped; text remains intact |
| **TC-READER-15** | Article metadata resolves correctly | Reading time, CEFR, sourceName, publishedAt present |
| **TC-READER-16** | SEO metadata generated for public article | Title, description, canonical, OpenGraph generated |
| **TC-READER-17** | Unpublished article does not generate SEO | Generates fallback/not-found metadata |
| **TC-READER-18** | Source attribution is present | `sourceName` and `sourceUrl` rendered |
| **TC-READER-19** | No internal/admin metadata exposed | Private admin fields omitted from public view model |
| **TC-READER-20** | Client/server boundary integrity | Public service exports pure server functions |
| **TC-READER-21** | Translation preference persistence valid | Validates `ALL`, `HOVER`, `HIDE` enum contract |
| **TC-READER-22** | Long content usability & slicing | Sentence slicer performs with 100+ sentences without latency |
| **TC-READER-23** | Missing vocabulary relation handled safely | Null vocabulary link does not throw; renders raw token |
| **TC-READER-24** | Zero-sentence article handled gracefully | Empty sentence list renders empty state cleanly |

---

## 22. Files to Create and Modify

### 22.1 Files to Create (7 files)
1. `[NEW]` `src/lib/sentence-slicer.ts`: High-performance text segmenter with offset bounds and overlap safeguards.
2. `[NEW]` `src/components/reader/reading-progress-bar.tsx`: Sticky scroll progress bar client component.
3. `[NEW]` `src/components/reader/reader-toolbar.tsx`: Sticky reader controls (translation toggle, font size buttons, progress percentage).
4. `[NEW]` `src/components/reader/bilingual-sentence-list.tsx`: Interactive sentence list container managing active sentence and preferences.
5. `[NEW]` `src/components/reader/bilingual-sentence-item.tsx`: Sentence pair component rendering sliced highlights and translation reveal logic.
6. `[NEW]` `src/components/reader/vocabulary-popover.tsx`: Accessible vocabulary definition popover with IPA, CEFR badge, and examples.
7. `[NEW]` `scripts/verify-reader.ts`: 24-test automated verification suite.

### 22.2 Files to Modify (4 files)
1. `[MODIFY]` `src/app/(public)/articles/[slug]/page.tsx`: Upgrade from Phase 5 preview into full interactive bilingual reader.
2. `[MODIFY]` `src/app/(public)/articles/[slug]/loading.tsx`: Add dedicated reader skeleton loading state.
3. `[MODIFY]` `PROJECT_STATUS.md`: Synchronize Phase 6 status.
4. `[MODIFY]` `IMPLEMENTATION_PLAN.md`: Synchronize Phase 6 status.

---

## 23. Database / Schema Changes
- **NONE**. The existing 14 entities, relations, indexes, and fields created in Phase 2 fully satisfy all Phase 6 reading requirements.

---

## 24. Key Risks & Mitigations
| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| **Text corruption from overlapping highlights** | High | Slicer enforces `h.startOffset >= currentIndex`. Overlapping secondary highlights are discarded cleanly. |
| **Hydration mismatch on translation mode** | Medium | Server renders `'ALL'` visible by default. Client updates translation mode in `useEffect` post-mount. |
| **Unpublished article leak via reader URL** | High | `getPublicArticleBySlug()` enforces `getPublicArticleWhereClause()`, returning 404 for draft/archived/future items. |
| **Performance lag on long articles** | Medium | Pure text slicing without regex; lightweight client component architecture. |

---

## 25. Rollback Strategy
If any unforeseen blocker occurs during Phase 6:
1. Revert uncommitted changes via `git checkout -- .` and `git clean -fd`.
2. Database schema remains 100% untouched (zero schema changes introduced).
3. Automated test fixtures in `scripts/verify-reader.ts` use prefix `test-reader-` and are cleaned up in a `finally` block.

---

## 26. Definition of Done
- [ ] Phase 6 Implementation Plan approved by user.
- [ ] Text slicing utility implemented in `src/lib/sentence-slicer.ts` with bounds and overlap validation.
- [ ] Reader components implemented in `src/components/reader/`:
  - `ReadingProgressBar`
  - `ReaderToolbar`
  - `BilingualSentenceList`
  - `BilingualSentenceItem`
  - `VocabularyPopover`
- [ ] `src/app/(public)/articles/[slug]/page.tsx` upgraded into complete bilingual reader with translation toggle, font sizing, and progress tracking.
- [ ] Dedicated loading skeleton created in `src/app/(public)/articles/[slug]/loading.tsx`.
- [ ] `scripts/verify-reader.ts` executes and passes all 24 test cases (24/24 PASS).
- [ ] Full regression pass: `verify-db.ts` (10/10), `verify-auth.ts` (10/10), `verify-admin.ts` (20/20), `verify-public.ts` (20/20), `verify-reader.ts` (24/24).
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [ ] `docs/phases/PHASE_06_REPORT.md` created with 20 sections.
- [ ] `PROJECT_STATUS.md` and `IMPLEMENTATION_PLAN.md` synchronized.
- [ ] User review and approval obtained before proceeding to Phase 7.

---

## 27. Explicit Out-of-Scope Items
- Full personal Word Bank drawer and saving vocabulary to profile (Reserved for **Phase 7**).
- Spaced repetition flashcards (Reserved for **Phase 7**).
- User reading history tracking in database (Reserved for **Phase 9**).
- External translation API or AI translation generation.
- Audio speech synthesis service backend (uses available database audioUrl or browser Web Speech).
- Advertising or paywalls.

---

## 28. Strict Halt Notice & Status

```text
PHASE: 06
STATUS: WAIT
CURRENT DECISION: AWAITING_APPROVAL
```

> [!IMPORTANT]
> **NO IMPLEMENTATION HAS STARTED**:
> - No application source code, components, routes, or service files have been created or modified.
> - The agent has stopped in compliance with the mandatory workflow and is awaiting your explicit approval:
>   `APPROVE PHASE 6`
