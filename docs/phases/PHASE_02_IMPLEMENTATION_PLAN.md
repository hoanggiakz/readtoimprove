# PHASE 02 — IMPLEMENTATION PLAN (REVISED)

## 1. Phase Objective
Implement the complete PostgreSQL database persistence layer for **ReadToImprove** using **Prisma ORM** in strict accordance with the Phase 0 Database Schema Design (`docs/02_DATABASE_SCHEMA_DESIGN.md`) and architectural guidelines. Establish referential integrity, constraints, indexes, initial schema migration, database client singleton, transaction atomicity verification, and an educational, original bilingual seed script with sentence-aligned vocabulary offsets.

---

## 2. Scope
- Install and configure Prisma ORM (`prisma`, `@prisma/client`, and `tsx` for TypeScript execution).
- Configure local PostgreSQL 16 instance via dedicated Docker container (`readtoimprove-postgres`) with explicit port mapping `localhost:5433` (host) $\rightarrow$ `5432` (container) to avoid conflicts with existing host services on port 5432.
- Implement the comprehensive 14-entity Prisma schema in `prisma/schema.prisma` (`User`, `Article`, `Category`, `ArticleCategory`, `Sentence`, `Vocabulary`, `SentenceVocabulary`, `UserSavedVocabulary`, `ReadingHistory`, `Favorite`, `AuditLog`, `ArticleView`, `SystemSetting`).
- Configure strict referential integrity and deletion boundaries:
  - Deleting an `Article` cascades to `Sentence`, which cascades to `SentenceVocabulary`, as well as `ArticleCategory`, `ReadingHistory`, `Favorite`, and `ArticleView`.
  - **Vocabulary is a Global Entity**: Global `Vocabulary` records are **never** deleted upon article deletion, preserving vocabulary items for reuse across multiple articles and personal user word banks.
- Execute initial database migration using development migration workflow (`npx prisma migrate dev --name init_schema`).
- Explicitly document migration policies separating development (`prisma migrate dev`) from production deployment (`prisma migrate deploy`).
- Implement the Prisma Client singleton in `src/lib/prisma.ts` with global caching for Next.js hot-reloading.
- Develop a comprehensive database seeder `prisma/seed.ts` provisioning:
  - Initial `ADMIN` user account (password hashed with `bcryptjs` 12 rounds using `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` from `.env.local`).
  - Standard test `USER` account.
  - Core categories with English and Vietnamese taxonomy.
  - **Original Educational Content Only**: 3 completely original, project-owned educational news-style articles across B1, B2, and C1 CEFR levels (zero reproduced third-party copyrighted content from Guardian, NYT, Bloomberg, Reuters, etc.).
  - Sentence records with deterministic `orderIndex` and exact character offset mapping (`startOffset`, `endOffset`, `highlightedText`).
  - Lexical vocabulary entries with phonetic IPA, part of speech, Vietnamese translation, and contextual examples.
- Execute and verify seed execution (`npx prisma db seed`).
- Develop an expanded automated verification suite (`scripts/verify-db.ts`) validating:
  - Offset mathematical invariants: `startOffset >= 0`, `endOffset <= textEn.length`, `startOffset < endOffset`.
  - Text slicing identity: `highlightedText !== ""` and `textEn.slice(startOffset, endOffset) === highlightedText`.
  - Non-overlapping highlight integrity within sentences.
  - Sentence order uniqueness (`[articleId, orderIndex]`).
  - Transaction rollback and atomicity (`prisma.$transaction` error abort test).
  - Cascade deletion isolation (deleting test article purges child sentences and mappings while keeping global `Vocabulary` intact).

---

## 3. Out of Scope
- Authentication session endpoints, cookies, and NextAuth/Auth.js route handlers (Reserved for **Phase 3**).
- Admin CMS user interface and CRUD forms (Reserved for **Phase 4**).
- Public article reading frontend interface and interactive vocabulary popovers (Reserved for **Phase 6 & 7**).
- Search indexing with `pg_trgm` or external search engines (Reserved for **Phase 8**).

---

## 4. Requirements Covered
- **BRD/FSD Section 5 & 11**: Real PostgreSQL database with Prisma ORM, strict referential integrity, indexes, and timestamps.
- **BRD/FSD Section 10 & 12**: Admin account bootstrapping and bilingual content model (English title, Vietnamese title, sentences, vocabulary, CEFR levels, categories, SEO fields).
- **BRD/FSD Section 18**: Exact character offset mapping (`startOffset`, `endOffset`) for vocabulary highlighting without regex fragility.
- **BRD/FSD Section 20**: Strict copyright compliance: zero scraping or unlicensed reproduction of commercial publishers; all seed content is 100% original educational material.
- **BRD/FSD Section 21**: Phase 2 Database Implementation requirements.
- **BRD/FSD Section 31**: Database safety, migration hygiene, and non-destructive development workflow.

---

## 5. Current Project State
- Next.js 15+ App Router baseline, TypeScript strict mode, and Tailwind CSS configured and verified in Phase 1 (Git commit `5b0f0be`, `30b9ce6`).
- Docker Desktop is active on host with `postgres:16-alpine` cached locally.
- Host port 5432 is occupied by an external service; port 5433 is available and designated for `readtoimprove-postgres`.
- No database packages installed; no database files created yet.

---

## 6. Existing Files Relevant To This Phase
- [docs/02_DATABASE_SCHEMA_DESIGN.md](file:///d:/readtoimprove/docs/02_DATABASE_SCHEMA_DESIGN.md) *(Authoritative schema contract)*
- [docs/01_ARCHITECTURE_SPECIFICATION.md](file:///d:/readtoimprove/docs/01_ARCHITECTURE_SPECIFICATION.md)
- [docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md](file:///d:/readtoimprove/docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md)
- [.env.example](file:///d:/readtoimprove/.env.example)
- [package.json](file:///d:/readtoimprove/package.json)

---

## 7. Technical Decisions
1. **Docker Networking & Port Allocation**:
   - Host `localhost:5433` maps to Container `5432` (`ports: ["5433:5432"]`).
   - Local `DATABASE_URL` connects strictly to `postgresql://postgres:postgres@localhost:5433/readtoimprove?schema=public`.
2. **Global Vocabulary Lifecycle**:
   - `Vocabulary` is decoupled from article destruction. In `SentenceVocabulary`, the relation is:
     ```prisma
     sentence   Sentence   @relation(fields: [sentenceId], references: [id], onDelete: Cascade)
     vocabulary Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)
     ```
     Deleting an `Article` cascades and deletes its `Sentence` records, which in turn cascades and deletes `SentenceVocabulary` mappings. The parent `Vocabulary` record remains completely untouched and available for other articles and user saved banks.
3. **Seed Content Ownership & Copyright Safeguard**:
   - In accordance with Section 20 of BRD/FSD, seed data will not reproduce articles from *The Guardian*, *The New York Times*, *Bloomberg*, *The Economist*, or other publishers.
   - Seed articles will be original, high-quality educational news pieces crafted for ReadToImprove (e.g. *The Global Transition to Resilient Renewable Microgrids*, *Urban Forestry Innovations in Modern Megacities*, *The Evolution of Remote Work and Global Talent Mobility*).
4. **Prisma Client Singleton**:
   - Implement `prisma.ts` attaching the client to `globalThis` in development to prevent connection pooling exhaustion during Next.js hot-reloads.
5. **Password Hashing in Seeder**:
   - Use `bcryptjs` (cost factor 12) for the initial administrator password, ensuring compatibility with Phase 3 Authentication.

---

## 8. Architecture Changes
- Introduces data persistence tier (`Prisma ORM` $\rightarrow$ `PostgreSQL`).
- Adds `src/lib/prisma.ts` shared across all Server Components, Server Actions, and future services.

---

## 9. Folder / Module Structure
```text
prisma/
├── schema.prisma              # Complete 14-entity relational schema
├── seed.ts                    # Original educational bilingual seeder
└── migrations/                # Versioned SQL migration files
    └── [timestamp]_init_schema/
        └── migration.sql
src/
└── lib/
    ├── prisma.ts              # Singleton Prisma client
    ├── cefr.ts                # (Existing)
    └── utils.ts               # (Existing)
scripts/
└── verify-db.ts               # Extended relation, constraint, offset & atomicity tests
docker-compose.yml             # Local database container definition (port 5433:5432)
```

---

## 10. Files To Create
1. `docker-compose.yml`: Defines `readtoimprove-postgres` service with port mapping `5433:5432` and health check.
2. `prisma/schema.prisma`: Complete Prisma schema definition with all 14 entities and relations.
3. `prisma/seed.ts`: Seed script with admin credentials, categories, original educational articles, sentences, and vocabulary offsets.
4. `src/lib/prisma.ts`: Singleton Prisma client module.
5. `scripts/verify-db.ts`: Expanded verification script testing offset bounds, slicing, uniqueness, cascade isolation, and transaction rollbacks.
6. `.env.local`: Local environment file with active connection string on port 5433 (git-ignored).

---

## 11. Files To Modify
- [package.json](file:///d:/readtoimprove/package.json): Add `prisma`, `@prisma/client`, `tsx`, `bcryptjs`, `@types/bcryptjs`, and seed command `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- [IMPLEMENTATION_PLAN.md](file:///d:/readtoimprove/IMPLEMENTATION_PLAN.md): Update Phase 2 status.
- [PROJECT_STATUS.md](file:///d:/readtoimprove/PROJECT_STATUS.md): Synchronize project status.

---

## 12. Database Changes
Complete relational schema implementation:
- **Enums**:
  - `Role`: `USER`, `ADMIN`
  - `ArticleStatus`: `DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`
  - `CefrLevel`: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`
- **Tables (14 Entities)**:
  - `User`: Primary user accounts, roles, active status.
  - `Article`: Bilingual titles, excerpts, original educational source attribution, CEFR level, status, views, reading time, SEO fields.
  - `Category`: Categorization taxonomy with slugs and display ordering.
  - `ArticleCategory`: Many-to-many join table between Article and Category.
  - `Sentence`: Ordered sentence pairs (`textEn`, `textVi`) with unique constraint `[articleId, orderIndex]`.
  - `Vocabulary`: Global lexical repository (`word`, `normalizedLemma`, `ipa`, `pos`, `meaningVi`, `exampleEn`, `exampleVi`, `cefrLevel`).
  - `SentenceVocabulary`: Highlighting mapping with `startOffset`, `endOffset`, and `highlightedText`.
  - `UserSavedVocabulary`: User's personal saved word bank with mastery tracking.
  - `ReadingHistory`: Reading progress (percentage, completion) per article.
  - `Favorite`: User bookmarked articles.
  - `AuditLog`: Operational audit trail for administrative mutations.
  - `ArticleView`: Analytics logging for unique/aggregate views.
  - `SystemSetting`: Key-value configuration parameters.
- **Cascade Deletion Behavior**:
  - `Article` $\xrightarrow{\text{Cascade}}$ `Sentence` $\xrightarrow{\text{Cascade}}$ `SentenceVocabulary`.
  - `Article` $\xrightarrow{\text{Cascade}}$ `ArticleCategory`, `ReadingHistory`, `Favorite`, `ArticleView`.
  - `Vocabulary` records are **NOT** deleted when an `Article` or `Sentence` is deleted.

---

## 13. API / Server Changes
- No HTTP route handlers introduced in this phase.
- `prisma` client becomes available for server-side importing.

---

## 14. UI Changes
None during Phase 2.

---

## 15. Security Considerations
- Local PostgreSQL instance runs in an isolated Docker container reachable only at `localhost:5433`.
- Seed script hashes initial administrator password with `bcryptjs` (cost factor 12).
- Sensitive credentials (`DATABASE_URL`, `ADMIN_INITIAL_PASSWORD`) are stored only in `.env.local` which is strictly ignored by Git.
- Parameterized SQL queries are enforced by default through Prisma ORM to eliminate SQL injection vulnerabilities.

---

## 16. Environment Variables
Local development variables in `.env.local`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readtoimprove?schema=public"
ADMIN_EMAIL="admin@readtoimprove.com"
ADMIN_INITIAL_PASSWORD="AdminDevSecret2026!ChangeMe"
```

---

## 17. Dependencies
### Production Dependencies to Add:
- `@prisma/client`: `^6.4.0` (or latest stable compatible)
- `bcryptjs`: `^2.4.3`

### Dev Dependencies to Add:
- `prisma`: `^6.4.0`
- `tsx`: `^4.19.2`
- `@types/bcryptjs`: `^2.4.6`

---

## 18. Implementation Steps

### Step 1: Install Database Dependencies
- Add Prisma CLI, Prisma Client, `tsx`, and `bcryptjs` to `package.json`.
- Execute `npm install`.

### Step 2: Start Local PostgreSQL Database
- Create `docker-compose.yml` with port mapping `5433:5432`.
- Start container: `docker compose up -d`.
- Verify container is healthy and accepting connections on port 5433.

### Step 3: Implement Prisma Schema
- Create `prisma/schema.prisma` defining all 14 entities, enums, relations, cascade deletes, and composite indexes.
- Ensure `Vocabulary` relation in `SentenceVocabulary` permits cascade from mapping to link, but `Vocabulary` is never deleted by article deletion.
- Run `npx prisma validate` to confirm schema correctness.

### Step 4: Generate & Apply Initial Migration
- Create `.env.local` with the local connection string on port 5433.
- Run `npx prisma migrate dev --name init_schema` to create and execute SQL migration.
- Verify `prisma/migrations/` contains the generated migration SQL.

### Step 5: Implement Prisma Client Singleton
- Create `src/lib/prisma.ts` with global development caching pattern.

### Step 6: Develop Database Seeder (Original Content Only)
- Create `prisma/seed.ts`.
- Seed 1 Admin user (hashed password), 1 Test user.
- Seed 5 Categories (Technology, Business, Science & Environment, Health, Culture & Society).
- Seed 3 complete, original educational news articles with authentic sentence-by-sentence alignment:
  - Article 1 (B2 level): *The Global Transition to Resilient Clean Energy Grids*
  - Article 2 (C1 level): *Macroeconomic Implications of Global Supply Chain Diversification*
  - Article 3 (B1 level): *Urban Forestry and the Architecture of Healthier Cities*
- Compute and verify exact character offsets (`startOffset`, `endOffset`) for all vocabulary entries.
- Run `npx prisma db seed` and confirm successful execution.

### Step 7: Automated Verification Suite
- Create `scripts/verify-db.ts` implementing:
  - Offset mathematical validation (`startOffset >= 0`, `endOffset <= textEn.length`, `startOffset < endOffset`).
  - Substring slicing validation (`textEn.slice(startOffset, endOffset) === highlightedText`).
  - Sentence order uniqueness assertion.
  - Transaction atomicity & rollback verification test.
  - Cascade deletion test verifying `Article` deletion purges `Sentence` and `SentenceVocabulary` while preserving `Vocabulary`.
- Execute `npx tsx scripts/verify-db.ts`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` to ensure zero regressions.

---

## 19. Migration Strategy & Environment Discipline

### 19.1 Development Environment (Local)
- Use **`npx prisma migrate dev`**:
  - Automatically creates new timestamped migration SQL files.
  - Applies migrations to the local database.
  - Regenerates `@prisma/client`.
  - Executes seeder if configured.

### 19.2 Production Environment (Vercel / Staging)
- Use **`npx prisma migrate deploy`**:
  - Applies only pending migrations in order.
  - Strictly non-interactive (never prompts or resets database).
  - Does NOT regenerate schema or generate new migration files.
- **CRITICAL RULE**: **NEVER** run `prisma migrate dev` or `prisma migrate reset` against production databases.

### 19.3 Migration Rollback & Recovery Strategy
- **Failed Local Migration**:
  - If a migration fails during local development, inspect the error in the console.
  - Fix the `schema.prisma` issue.
  - If migration state becomes desynchronized in local dev: execute `npx prisma migrate reset` (only on local development database).
- **Failed Production Migration**:
  - Stop the deployment immediately.
  - Analyze the migration error log.
  - Create a forward-fix migration locally (`npx prisma migrate dev --name fix_xxx`), test thoroughly, and deploy via `prisma migrate deploy`.
  - Always back up the production database before executing major schema modifications.

---

## 20. Testing Strategy & Test Cases
| Case ID | Description | Validation Command / Method | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-DB-01** | Schema Validation | `npx prisma validate` | Schema is valid, no syntax or relation errors. |
| **TC-DB-02** | Initial Migration | `npx prisma migrate dev --name init_schema` | Migration SQL created in `prisma/migrations/` and applied to PostgreSQL on port 5433. |
| **TC-DB-03** | Database Seeder | `npx prisma db seed` | Seed runs cleanly; Admin, User, Categories, Articles, Sentences, and Vocabulary populated. |
| **TC-DB-04** | Offset Mathematical Bounds | `verify-db.ts` | For every mapping: `startOffset >= 0`, `endOffset <= textEn.length`, `startOffset < endOffset`. |
| **TC-DB-05** | Offset Slicing Identity | `verify-db.ts` | For every mapping: `textEn.slice(startOffset, endOffset) === highlightedText` and `highlightedText.length > 0`. |
| **TC-DB-06** | Sentence Order Uniqueness | `verify-db.ts` | Inserting duplicate `[articleId, orderIndex]` throws `P2002` unique constraint violation. |
| **TC-DB-07** | Transaction Atomicity & Rollback | `verify-db.ts` | `$transaction` that throws midway rolls back all mutations; zero orphaned records created. |
| **TC-DB-08** | Global Vocabulary Preservation | `verify-db.ts` | Deleting a test article deletes sentences and mappings, but related `Vocabulary` record remains in database. |
| **TC-DB-09** | Deep Relational Traversal | `verify-db.ts` | Query retrieves Article $\rightarrow$ Sentences $\rightarrow$ SentenceVocabulary $\rightarrow$ Vocabulary. |
| **TC-DB-10** | Full Application Health | `npm run typecheck && npm run lint && npm run build` | All pass with zero errors. |

---

## 21. Review Checklist
- [ ] Schema exactly mirrors `docs/02_DATABASE_SCHEMA_DESIGN.md`.
- [ ] Vocabulary is preserved as a global entity upon article deletion.
- [ ] Port mapping is explicitly host `localhost:5433` $\rightarrow$ container `5432`.
- [ ] Seed data uses 100% original educational content (zero third-party copyrighted news reproduction).
- [ ] No plaintext passwords in database or seed files (bcrypt cost factor 12 used).
- [ ] `.env.local` is git-ignored and not committed.
- [ ] Composite indexes on `[status, publishedAt]` and `[cefrLevel]` present.
- [ ] Unique constraints on sentence ordering `[articleId, orderIndex]` present.
- [ ] Transaction rollback verification test included in `verify-db.ts`.
- [ ] Migration strategy explicitly documents dev (`migrate dev`) vs production (`migrate deploy`).
- [ ] Rollback and recovery strategies documented.

---

## 22. Risks
| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Port 5432 collision with existing containers | High | Explicitly map to `localhost:5433:5432` in `docker-compose.yml` and `.env.local`. |
| Next.js dev server connection exhaustion | Medium | Singleton pattern attaching Prisma client to `globalThis` in `src/lib/prisma.ts`. |
| Character offset drift when modifying sentence text | High | Validation script strictly enforces `textEn.slice(startOffset, endOffset) === highlightedText`. |
| Production migration accident | Critical | Clear environment documentation; production CI/CD uses only `prisma migrate deploy`. |

---

## 23. Rollback / Recovery Strategy
- **Local Development**: In case of a broken migration during local development, use `npx prisma migrate reset` to cleanly wipe and re-seed the local development database.
- **Production Environment**: Never run reset in production. Apply forward migrations using `prisma migrate deploy` after testing locally.

---

## 24. Definition of Done
- [ ] Phase 2 Implementation Plan revised and approved by user.
- [ ] PostgreSQL container running and healthy on `localhost:5433`.
- [ ] `prisma/schema.prisma` defined with all 14 entities and verified relations.
- [ ] Global `Vocabulary` preservation verified (not deleted upon article deletion).
- [ ] Initial migration created and applied cleanly via `prisma migrate dev`.
- [ ] `src/lib/prisma.ts` singleton client implemented and exported.
- [ ] Database seeder `prisma/seed.ts` implemented using 100% original educational content.
- [ ] `npx prisma db seed` executed successfully.
- [ ] Automated verification script `scripts/verify-db.ts` passes all 10 test cases (including offset invariants, transaction rollback, and global vocab preservation).
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [ ] `docs/phases/PHASE_02_REPORT.md` created.
- [ ] `PROJECT_STATUS.md` and `IMPLEMENTATION_PLAN.md` synchronized.

---

## 25. Approval Gate
STATUS: WAITING_FOR_APPROVAL
