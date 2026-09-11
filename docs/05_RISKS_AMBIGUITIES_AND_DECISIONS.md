# ReadToImprove: Risks, Ambiguities & Technical Decisions

## 1. Resolved Ambiguities & Product Decisions

| Area | Ambiguity / Question | Resolution / Decision | Rationale |
| :--- | :--- | :--- | :--- |
| **Admin Route Selection** | Exact URI path for the stealth admin area | Default path `/secure-console-x7`, customizable via `ADMIN_ROUTE_PATH` environment variable. | Keeps route out of scanner dictionaries while allowing environment-level overrides for different staging/production deployments. |
| **Search Engine Strategy** | PostgreSQL Search vs Meilisearch/Elasticsearch | Start with PostgreSQL full-text search (`tsvector` & `pg_trgm`). | Fits the modular monolith principle; avoids extra infrastructure and costs during early phases while delivering sub-50ms search for up to 100,000 articles. |
| **Sentence-Vocabulary Mapping** | How to handle repeated words in a single sentence without incorrect highlights | Store exact character boundaries (`startOffset`, `endOffset`) in `SentenceVocabulary`. | Eliminates regex false matches, ensures O(N) linear slice rendering, and supports multi-word idiomatic phrases. |
| **Audio Pronunciation** | Storing MP3s vs Browser Web Speech API | Hybrid approach: Web Speech API synthesis as immediate fallback; optional MP3 audioUrl field in `Vocabulary` schema. | Provides instant zero-cost pronunciation for all words while allowing custom recorded audio for nuanced phonetics. |
| **Guest User Reading** | Require login before reading? | Unauthenticated users can read all published articles freely. Authentication is only required for saving vocabulary, tracking history, or admin access. | Maximizes top-of-funnel acquisition, SEO indexing, and user trial without friction. |

---

## 2. Copyright & Fair Use Safeguards (Section 20 Compliance)

1. **Source Attribution**:
   - Every article record mandatorily requires `sourceName` (e.g. *BBC News*, *Reuters*, *The Guardian*) and `sourceUrl`.
   - The reader view prominently presents a "Source & Attribution" badge with a direct outbound link.
2. **Transformative Educational Use**:
   - Content is transformed through sentence-level bilingual translation, CEFR classification, grammatical lemma parsing, and interactive lexical notes for language learning purposes under Fair Use / educational commentary principles.
3. **No Automated Unauthorized Scraping**:
   - CMS ingestion is strictly editorial/curated. Automated bulk scraping of copyrighted news sites is prohibited.

---

## 3. Performance Budget & Core Web Vitals

| Metric | Target | Optimization Strategy |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | $< 1.5\text{s}$ | Server-rendered HTML via React Server Components; minimal blocking CSS. |
| **Largest Contentful Paint (LCP)** | $< 2.5\text{s}$ | Next.js `<Image>` optimization for article thumbnails with `priority` loading on hero images; AVIF/WebP formats. |
| **Cumulative Layout Shift (CLS)** | $< 0.1$ | Fixed aspect ratio containers for thumbnails; reserved skeleton dimensions for dynamic components. |
| **Time to Interactive (TTI)** | $< 3.0\text{s}$ | Modular client boundaries; interactive popovers and drawers are lazy-loaded on client interaction. |

---

## 4. Risk Assessment & Mitigation Matrix

| Risk ID | Risk Description | Severity | Probability | Mitigation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **R-01** | Unauthorized discovery and probing of Admin URL | High | Medium | Enforce strict server-side authorization (`requireAdmin()`); zero DOM leaks; return 401/403 with rate limiting and audit logging. |
| **R-02** | Slow reading page load due to large sentence/vocab trees | Medium | Low | Use Prisma `select` projections to fetch only required fields; leverage Next.js stale-while-revalidate caching (`revalidatePath`). |
| **R-03** | Sentence offset misalignment when editing text in CMS | High | Low | In Admin Sentence Editor, recomputing offsets upon text edit or providing an interactive word-picker to re-anchor offsets automatically. |
| **R-04** | Accidental exposure of secrets in Git | Critical | Low | Strict `.gitignore` rules; automated checks; `.env.example` placeholder template. |
| **R-05** | Production database connection exhaustion on Vercel | Medium | Medium | Use Prisma Accelerate or PostgreSQL connection pooler (e.g. PgBouncer / Neon connection pooling). |
