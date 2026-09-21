# ReadToImprove — Bilingual English–Vietnamese News Reading Platform

ReadToImprove is a modern, production-grade educational web application inspired by ReadToLead, specifically engineered to empower English learners (CEFR B1–C2, IELTS/TOEFL aspirants, and working professionals) through authentic bilingual news comprehension.

---

## The Golden Reading Loop

```text
English Sentence  ──>  Vietnamese Translation  ──>  Vocabulary Highlighting  ──>  Interactive Tooltip  ──>  Personal Word Bank
```

---

## Key Features

- **Bilingual Article Reader**: Sentence-by-sentence parallel alignment preserving exact character integrity with 3 translation display modes (*Show All*, *Interactive Click-to-Reveal*, *Hide All*) and 4 adjustable font sizes.
- **Interactive Vocabulary Engine**: Algorithmic offset slicing highlighting CEFR B1–C2 vocabulary tokens with phonetic IPA pronunciation, Vietnamese contextual meanings, and audio pronunciation.
- **Personal Word Bank**: Authenticated vocabulary saving with instant optimistic UI, trigram full-text search (`pg_trgm`), CEFR level filtering, and source sentence context preservation.
- **Hybrid PostgreSQL Full-Text Search**: Sub-100ms discovery engine combining English `tsvector` weighted GIN indexes (stemming enabled) and Vietnamese trigram GIN indexes with real-time debounced autocomplete and `Ctrl+K` command dialog.
- **Reading History & Progress Tracking**: Client-side scroll tracking with 5-second debouncing, automatic flush on document visibility change, monotonic server persistence (`Math.max(existing, new)`), and automatic completion at $\ge 90\%$.
- **Resume Reading UX**: Non-intrusive dismissible banner prompting learners to smoothly resume from their last saved reading position.
- **Explicit Favorites System**: Decoupled idempotent favoriting actions eliminating toggle race conditions.
- **Timezone-Aware Learning Analytics**: On-the-fly streak calculation under `Asia/Ho_Chi_Minh` timezone (< 5ms query latency) and zero-dependency, pure SVG 7-day reading velocity chart (< 2KB).
- **Stealth Admin CMS Console**: Unadvertised base route (`/secure-console-x7`) protected with cryptographic session verification, strict sole-admin guards, article publishing lifecycle state machines, and immutable audit logs.

---

## Technology Stack

- **Framework**: Next.js 15+ (App Router), React 19, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Radix UI / accessible primitives, Lucide Icons
- **Database**: PostgreSQL 16 (Containerized via Docker)
- **ORM**: Prisma Client with custom generated `tsvector` and `pg_trgm` GIN indexes
- **Validation**: Zod (Type-safe runtime contracts and schema boundaries)
- **Authentication & Security**: Signed cryptographic JWT sessions via `jose` + bcrypt password hashing + Open Redirect defense (`sanitizeReturnUrl`)
- **Rate Limiting**: Sliding-window rate limiting on discovery and mutation endpoints
- **API Specification**: OpenAPI 3.1 contract (`docs/api/openapi.yaml`)

---

## Quick Start / Local Setup

### 1. Prerequisites
- **Node.js**: v18.17.0+ or v20+
- **Docker**: Docker Desktop / Docker Engine (for PostgreSQL 16)
- **Git**: v2.30+

### 2. Clone & Install
```bash
git clone <REPOSITORY_URL> readtoimprove
cd readtoimprove
npm install
```

### 3. Configure Environment Variables
Copy the example environment template:
```bash
cp .env.example .env.local
```

Configure `.env.local` with your preferred credentials:
```env
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ReadToImprove"
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readtoimprove?schema=public"
AUTH_SECRET="replace-with-a-cryptographically-secure-secret-32-chars-min"
AUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@readtoimprove.com"
ADMIN_INITIAL_PASSWORD="ChangeThisPasswordImmediatelyInProduction2026!"
ADMIN_ROUTE_PATH="/secure-console-x7"
```

### 4. Start PostgreSQL Container
```bash
docker compose up -d
```
*Note: PostgreSQL is mapped to host port `5433` (container port `5432`) to prevent conflicts with local database installations.*

### 5. Run Migrations & Seed Data
```bash
npx prisma migrate deploy
npx prisma db seed
```

Default seeded credentials:
- **Learner User**: `learner@example.com` / `Learner2026!Password`
- **Administrator**: `admin@readtoimprove.com` / `ChangeThisPasswordImmediatelyInProduction2026!`

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Quality & Verification

The project enforces high automated test coverage across all completed phases:

```bash
# Run all phase verification suites (198 tests total)
npx tsx scripts/verify-db.ts               # Phase 02: Database & Relations (10 tests)
npx tsx scripts/verify-auth.ts             # Phase 03: Auth & Cryptographic JWT (10 tests)
npx tsx scripts/verify-admin.ts            # Phase 04: Private Admin CMS & Audit (20 tests)
npx tsx scripts/verify-public.ts           # Phase 05: Public Discovery & Feeds (20 tests)
npx tsx scripts/verify-reader.ts           # Phase 06: Article Reader & Slicing (26 tests)
npx tsx scripts/verify-word-bank.ts        # Phase 07: Word Bank & Trigrams (35 tests)
npx tsx scripts/verify-search.ts           # Phase 08: Full-Text Search & Filters (32 tests)
npx tsx scripts/verify-history-progress.ts # Phase 09: Reading History & Streaks (45 tests)

# TypeScript typechecking
npm run typecheck

# Code style & ESLint
npm run lint

# Production build validation
npm run build
```

---

## Git Remote Setup & Uploading

To upload this repository to your remote Git provider (GitHub, GitLab, Bitbucket):

```bash
# 1. Add your remote repository URL
git remote add origin https://github.com/<USERNAME>/<REPOSITORY_NAME>.git

# 2. Rename or ensure main/master branch
git branch -M master

# 3. Push all commits and tags
git push -u origin master
git push --tags

# Optional: If pushing feature branch as well
git push origin feat/phase-09
```

---

## Project Documentation Index

- [00. Project Discovery & Requirements](docs/00_DISCOVERY_AND_REQUIREMENTS.md)
- [01. Architecture Specification](docs/01_ARCHITECTURE_SPECIFICATION.md)
- [02. Database Schema Design](docs/02_DATABASE_SCHEMA_DESIGN.md)
- [03. Admin & Security Specification](docs/03_ADMIN_SECURITY_SPECIFICATION.md)
- [04. Content Model & Reading Experience](docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md)
- [05. Risks, Ambiguities & Technical Decisions](docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md)
- [Project State & ADR Log](docs/PROJECT_STATE.md)
- [OpenAPI 3.1 Specification](docs/api/openapi.yaml)

---

## Development Roadmap

- [x] **Phase 00 — Discovery & Specification** *(Completed)*
- [x] **Phase 01 — Project Foundation** *(Completed)*
- [x] **Phase 02 — Database Persistence & Seed Data** *(Completed)*
- [x] **Phase 03 — Authentication & Stealth Admin Route** *(Completed)*
- [x] **Phase 04 — Private Admin CMS Console** *(Completed)*
- [x] **Phase 05 — Public Discovery & Feeds** *(Completed)*
- [x] **Phase 06 — Article Reading Experience** *(Completed)*
- [x] **Phase 07 — Vocabulary System & Personal Word Bank** *(Completed)*
- [x] **Phase 08 — Global Search & Faceted Filters** *(Completed)*
- [x] **Phase 09 — User Reading History & Progress Tracking** *(Completed)*
- [ ] **Phase 10 — Flashcards & Spaced Repetition (SRS)** *(Next)*
- [ ] **Phase 10.5 — Unit Test Framework Setup (Vitest, RTL, Coverage)** *(Scheduled)*
- [ ] **Phase 11 — Comprehensive Testing & Security Audit** *(Scheduled)*
- [ ] **Phase 12 — Production Deployment (Vercel & Cloud Database)** *(Scheduled)*
- [ ] **Phase 13 — Production Hardening & Observability** *(Scheduled)*
