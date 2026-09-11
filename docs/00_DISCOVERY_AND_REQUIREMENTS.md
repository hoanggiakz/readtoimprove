# ReadToImprove: Discovery & Requirements Analysis

## 1. Executive Summary
**ReadToImprove** is a production-grade bilingual English–Vietnamese news reading and vocabulary acquisition platform inspired by ReadToLead. Its mission is to empower Vietnamese learners—ranging from intermediate students to IELTS/TOEFL test-takers and working professionals—to consume authentic English news with immediate bilingual comprehension and integrated vocabulary acquisition.

---

## 2. Target Audience & Personas

| Persona | English Proficiency | Primary Goals | Key Pain Points | Platform Solution |
| :--- | :--- | :--- | :--- | :--- |
| **IELTS / TOEFL Candidate** | B2 – C1 | Expand academic/topical vocabulary, understand complex syntax, build reading speed | Reading authentic news without a dictionary is tedious; looking up every word breaks flow | Instant sentence-aligned translation, inline lexical highlights, CEFR-rated vocabulary, contextual examples |
| **Working Professional** | B1 – B2 | Stay updated on global business, tech, and economy news while maintaining professional English | Lack of time; difficult idiomatic expressions and industry jargon | Bite-sized news articles, estimated reading time, Word Bank export, mobile-friendly interface |
| **University / High School Student** | B1 – C1 | General language improvement, reading comprehension practice, exam preparation | Hard to gauge if an article matches current reading level | Clear CEFR level tag (B1, B2, C1, C2), topic-based filtering, saved vocabulary flashcards |

---

## 3. Core Reading Flow (The "Golden Loop")

```text
[Authentic English Sentence]
          ↓
[Human-Grade Vietnamese Translation] (Toggleable: show/hide/hover)
          ↓
[Vocabulary Highlighting] (Color-coded or underlined based on CEFR level)
          ↓
[Vocabulary Detail Tooltip / Modal] (IPA, part of speech, Vietnamese meaning, contextual example)
          ↓
[Word Bank Drawer / Sidebar] (Grouped by CEFR B1–C2, quick audio pronunciation)
          ↓
[Save to Personal Word Bank] (Stored in user profile for spaced practice)
```

---

## 4. Functional Requirements Matrix

### 4.1 Content Management System (CMS)
- **Article Lifecycle**: Support draft, pending review, published, and archived states. Scheduled publishing at future timestamps.
- **Bilingual Structure**: Maintain strict pairing between each English sentence and its Vietnamese equivalent, with order indexes.
- **Vocabulary Tagging**: Link vocabulary items to sentences with character offsets (`startOffset`, `endOffset`) for precise highlight placement.
- **Categorization**: Multi-category taxonomy (e.g., Technology, Business, Science, Health, Environment, Culture).
- **Attribution & Copyright**: Prominent display of source name, canonical source URL, publication date, and copyright compliance notice.

### 4.2 Admin Console
- **Stealth Route**: Admin console accessed via unlinked, non-obvious URL (e.g. `/secure-console-x7`), excluded from sitemaps, robots.txt, and public DOM.
- **Server Authorization**: Defense-in-depth enforcement. Valid session + `ADMIN` role check on every action/route handler.
- **Full CRUD**: Articles, Sentences, Vocabulary, Categories, Users, Media uploads, SEO metadata, and Audit Logs.
- **Initial Bootstrap**: Provision initial admin via environment variables (`ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`), forced password rotation on first login.

### 4.3 Public Portal
- **Homepage**: Hero featured article, latest articles stream, category filter chips, CEFR level filter badges, search bar, pagination.
- **Article Reader**: Dual-pane or stacked sentence-by-sentence reading layout, translation toggle, adjustable font size, dark/light theme, reading progress bar, estimated reading time indicator.
- **Search & Discovery**: Title, snippet, and keyword search using PostgreSQL full-text search.
- **User Dashboard**: Authenticated user profile, Saved Vocabulary bank, Reading History with completion tracking, and Bookmarked Articles.

---

## 5. Non-Functional Requirements Matrix

| Category | Requirement | Target Metric |
| :--- | :--- | :--- |
| **Performance** | First Contentful Paint (FCP) | < 1.5s on desktop & broadband mobile |
| | Time to Interactive (TTI) | < 3.0s |
| | Lighthouse Score | ≥ 90 in Performance, SEO, Accessibility |
| **Accessibility** | Standard | WCAG 2.1 Level AA compliance |
| | Features | Full keyboard navigation, visible focus rings, ARIA dialogs, screen-reader friendly |
| **Security** | Authentication | BCrypt/Argon2 password hashing, HTTP-only secure cookies, CSRF protection |
| | Authorization | Server-side role validation (`requireAdmin()`), zero client-side only security |
| | Data Protection | Input validation via Zod schemas, SQL injection immunity via Prisma parameterized queries |
| **SEO** | Indexing | Dynamic OpenGraph images, JSON-LD Schema (`NewsArticle`, `BreadcrumbList`), dynamic `sitemap.xml`, `robots.txt` |
| | Admin Secrecy | Strictly disallowed in `robots.txt`, noindex headers, omitted from all public feeds |
