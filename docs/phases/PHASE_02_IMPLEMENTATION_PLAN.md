# PHASE 02 — IMPLEMENTATION PLAN

## 1. Phase Objective
Implement the complete PostgreSQL database persistence layer for **ReadToImprove** using **Prisma ORM** in strict accordance with the Phase 0 Database Schema Design (`docs/02_DATABASE_SCHEMA_DESIGN.md`). Establish referential integrity, constraints, indexes, initial schema migration, database client singleton, and an authentic bilingual seed script with sentence-aligned vocabulary offsets.

---

## 2. Scope
- Install and configure Prisma ORM (`prisma`, `@prisma/client`, and `tsx` for TypeScript execution).
- Configure local PostgreSQL 16 instance via dedicated Docker container (`readtoimprove-postgres` on port 5433) avoiding port 5432 conflicts.
- Implement the comprehensive 14-entity Prisma schema in `prisma/schema.prisma` (`User`, `Article`, `Category`, `ArticleCategory`, `Sentence`, `Vocabulary`, `SentenceVocabulary`, `UserSavedVocabulary`, `ReadingHistory`, `Favorite`, `AuditLog`, `ArticleView`, `SystemSetting`).
- Configure primary keys, foreign keys, unique constraints, cascade deletion policies (`onDelete: Cascade`), and performance indexes.
- Execute initial database migration (`npx prisma migrate dev --name init_schema`).
- Implement the Prisma Client singleton in `src/lib/prisma.ts` with global caching for Next.js development hot-reloading.
- Develop a comprehensive database seeder `prisma/seed.ts` provisioning:
  - Initial `ADMIN` user account (password hashed with `bcryptjs` 12 rounds using `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD` from `.env`).
  - Standard test `USER` account.
  - Core categories with English and Vietnamese taxonomy.
  - 3 complete, authentic bilingual news articles across B1, B2, and C1 CEFR levels.
  - Sentence records with deterministic `orderIndex` and precise character offset mapping (`startOffset`, `endOffset`, `highlightedText`).
  - Lexical vocabulary entries with phonetic IPA, part of speech, Vietnamese translation, and contextual examples.
- Execute and verify seed execution (`npx prisma db seed`).
- Develop automated database verification script testing relation traversal, constraint enforcement, and cascade deletions.

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
- **BRD/FSD Section 21**: Phase 2 Database Implementation requirements.
- **BRD/FSD Section 31**: Database safety, structured migrations, and non-destructive development workflow.

---

## 5. Current Project State
- Next.js 15+ App Router baseline, TypeScript strict mode, and Tailwind CSS configured and verified in Phase 1.
- Initial Git commit `5b0f0be` and report commit `30b9ce6`.
- Docker Desktop is active on host with `postgres:16-alpine` cached locally.
- Host port 5432 is currently occupied by an existing external container; port 5433 is reserved for `readtoimprove-postgres`.

---

## 6. Existing Files Relevant To This Phase
- [docs/02_DATABASE_SCHEMA_DESIGN.md](file:///d:/readtoimprove/docs/02_DATABASE_SCHEMA_DESIGN.md) *(Authoritative schema contract)*
- [docs/01_ARCHITECTURE_SPECIFICATION.md](file:///d:/readtoimprove/docs/01_ARCHITECTURE_SPECIFICATION.md)
- [docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md](file:///d:/readtoimprove/docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md)
- [.env.example](file:///d:/readtoimprove/.env.example)
- [package.json](file:///d:/readtoimprove/package.json)

---

## 7. Technical Decisions
1. **Docker Container Port Mapping**: Map local container port `5433:5432` to isolate `readtoimprove-postgres` from existing port 5432 services.
2. **Prisma Client Singleton**: Implement `prisma.ts` attaching the client to `globalThis` during development to prevent database connection exhaustion caused by Next.js hot-module reloading.
3. **Password Hashing in Seeder**: Use `bcryptjs` (12 salt rounds) in `prisma/seed.ts` for consistent password hashing matching Phase 3 Authentication requirements.
4. **Id Strategy**: Use `cuid()` for URL-safe, collision-resistant primary keys across all domain entities.
5. **Exact Character Offsets**: Enforce zero-based string slicing indices (`startOffset`, `endOffset`) matching `Sentence.textEn.slice(startOffset, endOffset) === highlightedText` in seed data.

---

## 8. Architecture Changes
- Introduces data persistence tier (`Prisma ORM` $\rightarrow$ `PostgreSQL`).
- Adds `src/lib/prisma.ts` shared across all Server Components, Server Actions, and future services.

---

## 9. Folder / Module Structure
```text
prisma/
├── schema.prisma              # Complete 14-entity relational schema
├── seed.ts                    # TypeScript seeder with authentic bilingual articles
└── migrations/                # Versioned SQL migration files
    └── [timestamp]_init_schema/
        └── migration.sql
src/
└── lib/
    ├── prisma.ts              # Singleton Prisma client
    ├── cefr.ts                # (Existing)
    └── utils.ts               # (Existing)
scripts/
└── verify-db.ts               # Verification script for database relations and constraints
docker-compose.yml             # Optional local database definition for reproducible setup
```

---

## 10. Files To Create
1. `docker-compose.yml`: Defines `readtoimprove-postgres` service on port 5433 with persistent volume.
2. `prisma/schema.prisma`: Complete Prisma schema definition.
3. `prisma/seed.ts`: Seed script with admin credentials, categories, bilingual articles, sentences, and vocabulary.
4. `src/lib/prisma.ts`: Singleton Prisma client module.
5. `scripts/verify-db.ts`: Automated test script verifying relations, constraints, and cascade behaviors.
6. `.env.local`: Local environment file with active local database connection string (git-ignored).

---

## 11. Files To Modify
- [package.json](file:///d:/readtoimprove/package.json): Add `prisma`, `@prisma/client`, `tsx`, `bcryptjs`, `@types/bcryptjs`, and define `"prisma": { "seed": "tsx prisma/seed.ts" }`.
- [IMPLEMENTATION_PLAN.md](file:///d:/readtoimprove/IMPLEMENTATION_PLAN.md): Update Phase 2 status.
- [PROJECT_STATUS.md](file:///d:/readtoimprove/PROJECT_STATUS.md): Synchronize project status.

---

## 12. Database Changes
Complete relational schema implementation:
- **Enums**:
  - `Role` (`USER`, `ADMIN`)
  - `ArticleStatus` (`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `ARCHIVED`)
  - `CefrLevel` (`A1`, `A2`, `B1`, `B2`, `C1`, `C2`)
- **Tables (14 Entities)**:
  - `User`: Primary user accounts, roles, active status.
  - `Article`: Bilingual titles, excerpts, source attribution, CEFR level, status, views, SEO fields.
  - `Category`: Categorization taxonomy with slugs and display ordering.
  - `ArticleCategory`: Many-to-many join table between Article and Category.
  - `Sentence`: Ordered sentence pairs (`textEn`, `textVi`) with unique constraint `[articleId, orderIndex]`.
  - `Vocabulary`: Lexical entries (`word`, `normalizedLemma`, `ipa`, `meaningVi`, `exampleEn`, `cefrLevel`).
  - `SentenceVocabulary`: Highlighting mapping with `startOffset`, `endOffset`, and `highlightedText`.
  - `UserSavedVocabulary`: User's personal saved word bank with mastery tracking.
  - `ReadingHistory`: Reading progress (percentage, completion) per article.
  - `Favorite`: User bookmarked articles.
  - `AuditLog`: Operational audit trail for administrative mutations.
  - `ArticleView`: Analytics logging for unique/aggregate views.
  - `SystemSetting`: Key-value configuration parameters.
- **Cascade Rules**: Deleting an `Article` automatically cascades and deletes all related `Sentence`, `SentenceVocabulary`, `ArticleCategory`, `ReadingHistory`, `Favorite`, and `ArticleView` records.

---

## 13. API / Server Changes
- No HTTP route handlers introduced in this phase.
- `prisma` client becomes available for server-side importing.

---

## 14. UI Changes
None during Phase 2.

---

## 15. Security Considerations
- The local database runs with isolated credentials on port 5433.
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
- Create `docker-compose.yml` for PostgreSQL 16 on port 5433.
- Start the container: `docker compose up -d` (or `docker run`).
- Verify container is healthy and accepting connections.

### Step 3: Implement Prisma Schema
- Create `prisma/schema.prisma` defining all 14 entities, enums, relations, cascade deletes, and composite indexes.
- Run `npx prisma validate` to confirm schema correctness.

### Step 4: Generate & Apply Initial Migration
- Create `.env.local` with the local connection string.
- Run `npx prisma migrate dev --name init_schema` to create and execute SQL migration.
- Verify `prisma/migrations/` contains the generated migration SQL.

### Step 5: Implement Prisma Client Singleton
- Create `src/lib/prisma.ts` with global development caching pattern.

### Step 6: Develop Database Seeder
- Create `prisma/seed.ts`.
- Seed 1 Admin user (hashed password), 1 Test user.
- Seed 5 Categories (Technology, Business, Science, Health, Culture).
- Seed 3 complete authentic bilingual articles with sentences and exact vocabulary highlight offsets (`startOffset`, `endOffset`).
- Run `npx prisma db seed` and confirm successful execution.

### Step 7: Automated Verification
- Create `scripts/verify-db.ts` to run programmatic sanity queries:
  - Query articles with sentences, vocabulary, and categories.
  - Verify character offset accuracy against sentence text.
  - Test cascade deletion behavior on an isolated draft test record.
- Execute `npx tsx scripts/verify-db.ts`.
- Run `npm run typecheck`, `npm run lint`, and `npm run build` to ensure zero regressions.

---

## 19. Testing Strategy
1. **Schema Validation**: `npx prisma validate`
2. **Migration Verification**: `npx prisma migrate status`
3. **Seed Integrity**: Query count verification for users, articles, sentences, vocabulary, and join tables.
4. **Offset Accuracy Test**: Assert that for every `SentenceVocabulary`, `sentence.textEn.substring(startOffset, endOffset) === highlightedText`.
5. **Referential Integrity & Cascade Test**: Create temporary article with sentences and delete it; verify all child records are purged without foreign key violations.
6. **Application Build Health**: `npm run typecheck`, `npm run lint`, `npm run build`.

---

## 20. Test Cases
| Case ID | Description | Expected Outcome |
| :--- | :--- | :--- |
| **TC-DB-01** | `npx prisma validate` | Schema is valid, no syntax or relation errors. |
| **TC-DB-02** | `npx prisma migrate dev` | SQL migration created and executed cleanly against PostgreSQL. |
| **TC-DB-03** | `npx prisma db seed` | Seed runs cleanly; Admin, User, Categories, Articles, Sentences, and Vocabulary populated. |
| **TC-DB-04** | Offset Verification | All seeded `startOffset` and `endOffset` match exact substrings in `textEn`. |
| **TC-DB-05** | Relation Traversal | Deep relational query retrieves Article $\rightarrow$ Sentences $\rightarrow$ SentenceVocabulary $\rightarrow$ Vocabulary. |
| **TC-DB-06** | Unique Constraints | Inserting duplicate `[articleId, orderIndex]` throws `P2002` unique constraint error. |
| **TC-DB-07** | Cascade Delete | Deleting an article deletes its sentences and sentence-vocabularies cleanly. |
| **TC-DB-08** | Full Regression | `npm run typecheck`, `npm run lint`, and `npm run build` all pass. |

---

## 21. Review Checklist
- [ ] Schema exactly mirrors `docs/02_DATABASE_SCHEMA_DESIGN.md`.
- [ ] No plaintext passwords in database or seed files.
- [ ] `.env.local` is git-ignored and not committed.
- [ ] Composite indexes on `[status, publishedAt]` and `[cefrLevel]` present.
- [ ] Unique constraints on sentence ordering and user saved vocabulary present.
- [ ] Cascade delete rules verified.
- [ ] Offset calculation matches sentence string slicing exactly.

---

## 22. Risks
| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Port 5432 conflict with host Docker | High | Explicitly map to port `5433` (`5433:5432`) in `.env.local` and docker configuration. |
| Next.js dev server connection leak | Medium | Use singleton pattern attaching `prisma` to `globalThis` in `src/lib/prisma.ts`. |
| Seed offset mismatch | Medium | Programmatically compute offsets in seed data or assert `textEn.slice(startOffset, endOffset) === word`. |

---

## 23. Rollback / Recovery Strategy
- If a migration fails during development, use `npx prisma migrate reset` against the local development database to cleanly recreate the schema.
- Because migrations are version-controlled in `prisma/migrations/`, rollback can be managed by rolling back migration files.
- Never run destructive commands against production environments.

---

## 24. Definition of Done
- [ ] Phase 2 Implementation Plan approved by user.
- [ ] PostgreSQL container running and reachable on port 5433.
- [ ] `prisma/schema.prisma` defined with all 14 entities and relations.
- [ ] Initial migration created and applied (`prisma migrate dev`).
- [ ] `src/lib/prisma.ts` singleton client created and exported.
- [ ] Database seeder `prisma/seed.ts` implemented with authentic bilingual data.
- [ ] `npx prisma db seed` executed successfully.
- [ ] Automated verification script `scripts/verify-db.ts` passes all tests.
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [ ] `docs/phases/PHASE_02_REPORT.md` created.
- [ ] `PROJECT_STATUS.md` updated.

---

## 25. Approval Gate
STATUS: WAITING_FOR_APPROVAL
