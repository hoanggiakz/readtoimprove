# PHASE 06 — PHASE REPORT

## 1. Phase
**PHASE 06 — ARTICLE READING EXPERIENCE**

```text
PHASE: 06
STATUS: WAIT
RESULT: PASS
COMMIT: 1519c44
WORKTREE: CLEAN
NEXT: PHASE 07 — VOCABULARY & WORD BANK (DO NOT START AUTOMATICALLY)
```

---

## 2. Objective
Transform `/articles/[slug]` from a standard article preview page into a rich, immersive, bilingual English-learning reading environment. Deliver an educational reader tailored for Vietnamese learners that supports:
1. **Sentence-by-sentence English/Vietnamese alignment**: Side-by-side / stacked bilingual pairs with distinct visual hierarchy.
2. **Three Translation Visibility Modes**: `Show all` (`ALL`), `Hover / Tap to reveal` (`INTERACTIVE`), and `English only` (`HIDE`).
3. **Persistent Reader Preferences**: Safe client-side `localStorage` caching for translation mode and font size with SSR-safe hydration defaults (`ALL` and `MEDIUM`).
4. **Precise Offset-Based Vocabulary Highlighting**: Deterministic slicing engine mapping character offset intervals to CEFR-level badge tokens.
5. **Interactive Vocabulary Popovers**: Accessible Radix/shadcn-based popovers revealing headword, phonetic IPA, audio pronunciation, part of speech, CEFR badge, Vietnamese definition, and bilingual contextual examples.
6. **Dynamic Reading Progress**: Lightweight, `requestAnimationFrame`-throttled reading progress bar pinned to the top of the viewport.
7. **Multi-Step Font Size Controls**: `SMALL`, `MEDIUM`, `LARGE`, `EXTRA_LARGE` scaling for comfortable reading across screen sizes.
8. **Responsive & Accessible UX**: WCAG 2.1 AA compliant keyboard navigation (`Tab`, `Enter`, `Space`, `Escape`), touch-friendly tap targets, and no color-only state representation.
9. **Zero Prisma Leakage & Single Optimized Query**: Pure React Server Component querying database once with clean serializable DTO transformation.
10. **Preserved SEO & Source Attribution**: Open Graph metadata, JSON-LD `NewsArticle` schema, and clear canonical source attribution.

---

## 3. Scope
- **In Scope**:
  - Sentence slicing engine (`src/lib/sentence-slicer.ts`) validating bounds, sorting by offset, and skipping overlaps safely without character corruption.
  - Dedicated reader UI components: `reading-progress-bar.tsx`, `reader-toolbar.tsx`, `bilingual-sentence-list.tsx`, `bilingual-sentence-item.tsx`, `vocabulary-popover.tsx`.
  - Upgraded Server Component page `src/app/(public)/articles/[slug]/page.tsx` with DTO serialization and JSON-LD structured data.
  - Loading skeleton `src/app/(public)/articles/[slug]/loading.tsx`.
  - Comprehensive automated test suite `scripts/verify-reader.ts` covering 26 verification test cases (`TC-READER-01` to `TC-READER-26`).
  - Browser E2E verification of interactive features (popovers, translation toggling, font resizing, scroll progress).
- **Out of Scope (Deferred to Future Phases)**:
  - Personal Word Bank drawer and saving words to user profile (`Phase 07`).
  - User reading history tracking (`Phase 09`).
  - Database schema changes (zero migrations required).

---

## 4. Files Created
1. `src/lib/sentence-slicer.ts`: Pure algorithmic engine for slicing raw English text into plain text and vocabulary segments with strict offset bounds and overlap protection.
2. `src/components/reader/reading-progress-bar.tsx`: Slim, accessible top progress bar updating on scroll via `requestAnimationFrame`.
3. `src/components/reader/reader-toolbar.tsx`: Sticky reader control bar containing translation mode pills (`ALL`, `INTERACTIVE`, `HIDE`), font sizing toggles (`A-`, `A+`), and sentence count badge.
4. `src/components/reader/bilingual-sentence-list.tsx`: Client-side coordinator for reading preferences, active sentence highlighting, and local storage synchronization.
5. `src/components/reader/bilingual-sentence-item.tsx`: Sentence unit displaying sequential number, sliced vocabulary highlights, and accessible translation reveal controls.
6. `src/components/reader/vocabulary-popover.tsx`: Accessible vocabulary card dialog providing pronunciation audio, IPA, part of speech, CEFR level, Vietnamese translation, and examples.
7. `src/app/(public)/articles/[slug]/loading.tsx`: Dedicated skeleton loading state matching the reader layout.
8. `scripts/verify-reader.ts`: Complete automated test suite covering all 26 Phase 6 test criteria.
9. `docs/phases/PHASE_06_IMPLEMENTATION_PLAN.md`: Detailed engineering plan and architectural specification.
10. `docs/phases/PHASE_06_REPORT.md`: This comprehensive completion and review document.

---

## 5. Files Modified
1. `src/app/(public)/articles/[slug]/page.tsx`:
   - Updated from a simple preview page to a full bilingual reading environment.
   - Leveraged `getPublicArticleBySlug()` with single optimized relational query (`include: { categories: true, sentences: { include: { sentenceVocabularies: { include: { vocabulary: true } } } } }`).
   - Transformed raw database models into `SentenceDTO` containing serializable vocabulary metadata.
   - Injected JSON-LD `NewsArticle` schema into `<head>` for rich Google search indexing.
   - Enforced 404 `notFound()` protection for unpublished, draft, or future scheduled content.
2. `PROJECT_STATUS.md`:
   - Updated Phase 6 status to `COMPLETED`.
3. `IMPLEMENTATION_PLAN.md`:
   - Updated Phase 6 roadmap item to `COMPLETED & VERIFIED` and designated Phase 7 as `PENDING (NEXT)`.

---

## 6. Architecture
The reader follows a strict Server-First Architecture where data access is completely isolated to the server, and client-side code is restricted to user interactions:

```text
Browser Request: GET /articles/[slug]
       │
       ▼
Next.js Server Component (src/app/(public)/articles/[slug]/page.tsx)
       │
       ├── Authoritative Security Check: getPublicArticleBySlug()
       │     (status === "PUBLISHED" && publishedAt !== null && publishedAt <= now)
       │     If invalid/draft/scheduled/archived -> notFound() (404)
       │
       ├── Single Optimized Prisma Query (Articles + Categories + Sentences + Vocabularies)
       │
       ├── Data Transformation: Clean SentenceDTO[] (Zero Prisma object leakage)
       │
       ├── Static SEO & JSON-LD Structured Data Generation
       │
       ▼
Client Components (Islands of Interactivity)
       │
       ├── ReadingProgressBar (Scroll-driven requestAnimationFrame progress indicator)
       │
       └── BilingualSentenceList (Manages translationMode & fontSize state, localStorage sync)
             │
             ├── ReaderToolbar (Translation mode switcher, font size stepper, stats)
             │
             └── BilingualSentenceItem[] (Sequential sentence rows)
                   │
                   ├── Sliced English Text (src/lib/sentence-slicer.ts)
                   │     ├── Plain Text Segments
                   │     └── VocabularyHighlight Segments (CEFR color tokens & badges)
                   │           └── VocabularyPopover (Radix Popover with IPA, audio, meaning)
                   │
                   └── Aligned Vietnamese Translation (Always visible, interactive reveal, or hidden)
```

---

## 7. Reading Experience
- **Visual Distinction**: English sentences are displayed in dark, high-contrast typography (`text-foreground font-medium`). Vietnamese translations are set in softer, muted tones (`text-muted-foreground`) directly beneath each sentence with comfortable padding.
- **Sequential Indexing**: Every sentence is tagged with a two-digit index (e.g., `#01`, `#02`) to help learners maintain their reading position.
- **Sentence Focus**: Clicking or focusing any sentence marks it as active (`bg-primary/5 dark:bg-primary/10 border-primary/20`), guiding the reader through dense editorial texts.
- **Fallback Handling**: If an article has no sentences in the database, a clean informative fallback card invites the user to read the main body text without crashing.

---

## 8. Translation Modes
Three discrete translation modes satisfy different learning pedagogical styles:

| Mode | Key | UI Label | Behavior |
| :--- | :--- | :--- | :--- |
| **Show All** | `ALL` | `Show all` | Vietnamese translations are always visible below each English sentence. Ideal for beginners or quick comparative reading. |
| **Interactive** | `INTERACTIVE` | `Hover / Tap to reveal` | Vietnamese translations are hidden behind an accessible toggle button (`Xem dịch` / `Ẩn dịch`). Clicking or tapping reveals the translation. Translations also reveal on hover for mouse users. |
| **English Only** | `HIDE` | `English only` | Vietnamese translations are completely hidden. Encourages pure English reading immersion. |

### Hydration & LocalStorage Strategy
- **SSR Default**: The server renders the initial HTML with `translationMode = 'ALL'` and `fontSize = 'MEDIUM'`. This guarantees instant indexing by search engine crawlers and eliminates hydration mismatch errors.
- **Client Synchronization**: A post-mount `useEffect` reads `readtoimprove:translation-mode` and `readtoimprove:reader-font-size` from `localStorage`, immediately transitioning the UI to the user's saved preference.

---

## 9. Vocabulary Highlighting & Slicing Engine
The sentence slicing engine (`src/lib/sentence-slicer.ts`) is the core algorithmic module of Phase 6.

### 9.1 Invariant Validation
For every vocabulary highlight:
- `startOffset >= 0`
- `startOffset < endOffset`
- `endOffset <= textEn.length`
- Non-empty range (`startOffset !== endOffset`)

### 9.2 Overlapping Range Resolution
Highlights are sorted by `startOffset ASC`, then by `endOffset ASC`. When processing candidates:
- If a candidate's `startOffset < currentTextIndex`, it represents an overlapping or conflicting segment.
- The engine deterministically **skips** the secondary overlapping highlight rather than creating malformed nested markup.
- Slices satisfy the strict invariant:
  $$\sum \text{slice.text} = \text{sentence.textEn}$$
  Zero characters are lost, duplicated, or corrupted.

### 9.3 CEFR-Based Color Badges
Highlights are visually styled using the existing project CEFR tokens (`cefr-b1`, `cefr-b2`, `cefr-c1`, `cefr-c2`), featuring subtle background tints, distinct border underlines, and CEFR superscript badges so comprehension does not rely solely on color.

---

## 10. Vocabulary Popover
Clicking or pressing `Enter`/`Space` on any highlighted word triggers an accessible popover containing:
- **Headword & Audio**: English term with a web-speech synthesis speaker button (`🔊`).
- **Phonetic Transcription**: Accurate IPA spelling (e.g. `/səˈsteɪnəbəl/`).
- **Part of Speech & CEFR Badge**: Grammatical category (`noun`, `verb`, `adjective`, etc.) alongside the difficulty badge (`B2`, `C1`, etc.).
- **Vietnamese Definition**: Clear, primary contextual meaning.
- **Contextual Examples**: Example sentences in both English and Vietnamese.
- **Keyboard Dismissal**: Pressing `Escape` or clicking outside immediately closes the popover and restores focus.

---

## 11. Accessibility (WCAG 2.1 AA)
- **Keyboard Reachability**: All interactive elements (translation toggle buttons, font buttons, vocabulary highlights) are accessible via `Tab`.
- **Focus Management**: High-visibility focus rings (`focus-visible:ring-2 focus-visible:ring-primary ring-offset-2`).
- **Semantic ARIA Markup**:
  - Reading progress bar includes `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and `aria-label="Tiến độ đọc bài viết"`.
  - Sentence index buttons use `aria-expanded` reflecting translation visibility in Interactive mode.
  - Popovers are managed via `@radix-ui/react-popover` providing automated focus trapping, aria-expanded states, and escape handling.
- **Reduced Motion**: All transitions respect user OS preferences via `transition-all duration-200 motion-reduce:transition-none`.

---

## 12. Reading Progress
- Pinned, non-intrusive 3px gradient progress bar at the top of the viewport (`h-[3px] bg-primary transition-all duration-75`).
- Scroll handler throttles computations using `requestAnimationFrame`, preventing main thread scroll lag.
- Mathematical calculation accounts for viewport offset:
  $$\text{progress} = \frac{\text{window.scrollY}}{\text{documentHeight} - \text{windowHeight}} \times 100$$
- Progress is clamped smoothly between $0\%$ and $100\%$.

---

## 13. Font-Size Preferences
Four discrete font levels allow readers to adapt the typography to their comfort:
- `SMALL`: English `text-base`, Vietnamese `text-sm`.
- `MEDIUM` (Default): English `text-lg`, Vietnamese `text-base`.
- `LARGE`: English `text-xl`, Vietnamese `text-lg`.
- `EXTRA_LARGE`: English `text-2xl`, Vietnamese `text-xl`.

Font size adjustments scale smoothly without breaking layout geometry, vocabulary underlines, or popover positioning.

---

## 14. SEO & Structured Data
- Preserved dynamic `generateMetadata()` returning published article title, excerpt, Open Graph cards, and canonical URL.
- Injected Schema.org `NewsArticle` JSON-LD structured data including:
  - `@type: "NewsArticle"`
  - `headline`: English title
  - `description`: English excerpt
  - `datePublished`: ISO timestamp
  - `author`: Editorial team or original author
  - `publisher`: ReadToImprove
  - `inLanguage`: `["en", "vi"]`
- Unpublished, draft, or future articles return `notFound()`, ensuring zero search engine indexing of private content.

---

## 15. Security & Isolation
- **Server Isolation**: Database queries reside exclusively in `src/lib/articles.ts` and `src/app/(public)/articles/[slug]/page.tsx`. Zero database drivers or Prisma objects are passed to Client Components.
- **Sanitized DTOs**: Only serializable, strictly typed `SentenceDTO` arrays are passed to `BilingualSentenceList`. Internal database IDs and administrative metadata are stripped.
- **Public Visibility Rule**: The single authoritative filter `getPublicArticleWhereClause()` is strictly reused, ensuring drafts, pending reviews, archived, and future articles return HTTP 404.
- **XSS Prevention**: Zero `dangerouslySetInnerHTML` usage. All text slicing produces native React string children and DOM nodes.

---

## 16. Performance
- **Single Database Query**: Replaced potential $N+1$ queries with a single query utilizing Prisma `include` nesting (`categories`, `sentences`, `sentenceVocabularies.vocabulary`).
- **Lean Client Footprint**: The article page bundle is only **6.02 kB** (First Load JS: 111 kB shared), ensuring fast First Contentful Paint (FCP) and Time to Interactive (TTI).
- **Zero Heavy Dependencies**: Implemented without external state-management libraries (Redux/Zustand) or heavy animation runtimes.

---

## 17. Verification Results (26/26 Tests Passing)

Automated test suite `scripts/verify-reader.ts` executed and verified all 26 test specifications:

```text
======================================================================
READTOIMPROVE — PHASE 06 READER VERIFICATION SUITE
======================================================================
[TC-READER-01] Public article slug lookup .................... PASS
[TC-READER-02] Published-only visibility constraint .......... PASS
[TC-READER-03] Future scheduled article blocked (404) ........ PASS
[TC-READER-04] Draft article blocked (404) ................... PASS
[TC-READER-05] Pending review article blocked (404) .......... PASS
[TC-READER-06] Archived article blocked (404) ................ PASS
[TC-READER-07] Deterministic sentence ordering (orderIndex) .. PASS
[TC-READER-08] Exact English text fidelity ................... PASS
[TC-READER-09] Exact Vietnamese text fidelity ................ PASS
[TC-READER-10] Sentence-Article relational integrity ......... PASS
[TC-READER-11] Vocabulary associations retrieval ............. PASS
[TC-READER-12] Valid offset slice identity & text match ...... PASS
[TC-READER-13] Out-of-bounds offset rejection & safety ....... PASS
[TC-READER-14] Overlapping highlight deterministic safety .... PASS
[TC-READER-15] OpenGraph / Page metadata generation .......... PASS
[TC-READER-16] JSON-LD NewsArticle SEO metadata .............. PASS
[TC-READER-17] Unpublished content notFound() behavior ....... PASS
[TC-READER-18] Source attribution fidelity ................... PASS
[TC-READER-19] No internal/admin metadata leakage ............ PASS
[TC-READER-20] No Prisma/client boundary violation ........... PASS
[TC-READER-21] Translation mode persistence keys ............. PASS
[TC-READER-22] Long content slicing & performance ............ PASS
[TC-READER-23] Missing vocabulary relation graceful fallback . PASS
[TC-READER-24] Zero sentences graceful handling .............. PASS
[TC-READER-25] Keyboard-accessible vocabulary interaction .... PASS
[TC-READER-26] Keyboard-accessible translation controls ...... PASS
======================================================================
SUMMARY: 26/26 TESTS PASSED (100%)
======================================================================
```

---

## 18. Full Regression Results

All existing verification suites from Phases 2 through 5 were re-executed:

| Test Suite | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Phase 2 Database** | `npx tsx scripts/verify-db.ts` | **PASS (10/10)** | Prisma schema, cascade deletion, seeder |
| **Phase 3 Auth** | `npx tsx scripts/verify-auth.ts` | **PASS (10/10)** | Session security, bcrypt, requireAdmin |
| **Phase 4 Admin CMS** | `npx tsx scripts/verify-admin.ts` | **PASS (20/20)** | Article lifecycle, offsets, audit log |
| **Phase 5 Public** | `npx tsx scripts/verify-public.ts` | **PASS (20/20)** | Catalog, search, categories, public guards |
| **Phase 6 Reader** | `npx tsx scripts/verify-reader.ts` | **PASS (26/26)** | Slicing, bilingual UX, popovers, SEO |
| **TypeScript Typecheck** | `npm run typecheck` | **PASS** | 0 errors across entire workspace |
| **ESLint** | `npm run lint` | **PASS** | 0 warnings, 0 errors |
| **Next.js Production Build**| `npm run build` | **PASS** | 18 routes compiled, `/articles/[slug]` is 6.02 kB |

---

## 19. Browser E2E Verification
A full browser subagent was executed on the live running application (`http://localhost:3000/articles/clean-energy-microgrids-urban-resilience`):

### Verified Flows:
1. **Initial Page Load**: Rendered Hero image, source attribution, reading toolbar, and bilingual sentence list with `Show all` active.
2. **Vocabulary Popover**: Clicked the B2 highlighted term `"sustainable"`. Popover opened smoothly displaying `/səˈsteɪnəbəl/`, part of speech `adjective`, CEFR `B2` badge, Vietnamese translation `bền vững`, and bilingual example sentences.
3. **Audio & Escape Dismiss**: Verified pronunciation audio trigger; dismissed popover via `Escape` key.
4. **Interactive Mode**: Switched to `Hover / Tap to reveal`. Vietnamese translations collapsed. Clicked `Xem dịch` on sentence `#01`, successfully revealing the Vietnamese translation.
5. **Hide Mode**: Switched to `English only`. All Vietnamese translations were hidden, providing an English-only reading flow.
6. **Show All Mode**: Clicked `Show all`. All translations reappeared instantly.
7. **Font Size Resizing**: Clicked `A+` font size control twice. Sentence typography scaled up from `MEDIUM` to `EXTRA_LARGE` cleanly without layout overflow.
8. **Reading Progress Bar**: Scrolled through the article to the footer. Top progress indicator tracked continuously to $100\%$.

### Artifacts Captured:
- Browser Recording WebP: `file:///C:/Users/hoang/.gemini/antigravity-ide/brain/265eb029-56b2-4336-b42b-5c88c55dd5e0/reader_flow_demo_1789218335060.webp`
- Screenshots:
  - Initial Article View: `article_page_initial_1789218341858.png`
  - Toolbar & Aligned Sentences: `article_toolbar_and_content_1789218346977.png`
  - Vocabulary Popover Open: `vocabulary_popover_open_1789218361521.png`
  - Popover Dismissed: `popover_dismissed_1789218369216.png`
  - Interactive Mode: `interactive_mode_active_1789218378497.png`
  - Translation Revealed: `translation_revealed_1789218386647.png`
  - Hide Mode Active: `hide_mode_active_1789218399360.png`
  - Enlarged Font Size: `font_size_enlarged_1789218441715.png`
  - Progress Bar at 100%: `progress_bar_and_footer_1789218452206.png`

---

## 20. Senior Review Findings & Final Decision

### 20.1 Senior Review Summary
- **Code Quality**: Clean modular separation of concerns. `sentence-slicer.ts` is pure and deterministic. Components are small, focused, and testable.
- **Accessibility**: Full keyboard and screen-reader accessibility verified.
- **Performance**: Zero client waterfalls; zero $N+1$ database queries; sub-10 kB client component footprint.
- **Security**: Strict reuse of Phase 5 public visibility clause. No internal metadata exposure.

### 20.2 Known Limitations
- The "Lưu từ" (Save word) button inside the vocabulary popover currently displays a helpful message indicating that personal word bank persistence will be activated in **Phase 07 — Vocabulary & Word Bank**.

### 20.3 Final Decision
```text
PHASE: 06
STATUS: WAIT
RESULT: PASS
COMMIT: 1519c44
WORKTREE: CLEAN
NEXT: PHASE 07 — VOCABULARY & WORD BANK (DO NOT START AUTOMATICALLY)
```
Phase 06 is completely implemented, verified with 26 automated tests, tested via live browser E2E, and committed. All regression test suites pass cleanly. Standing by for user review and approval to proceed to Phase 07.
