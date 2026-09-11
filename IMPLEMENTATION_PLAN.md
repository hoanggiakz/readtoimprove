# READTOIMPROVE — MASTER IMPLEMENTATION PLAN

## 1. Project Overview
**ReadToImprove** is a production-grade bilingual English–Vietnamese news reading platform designed for English learners (IELTS/TOEFL students, university students, and working professionals) across CEFR levels B1–C2.

---

## 2. System Architecture & Tech Stack
- **Architecture**: Next.js Modular Monolith (App Router)
- **Frontend**: Next.js 15+, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Next.js Server Components, Server Actions, Route Handlers, Service Layer, Zod validation
- **Database**: PostgreSQL 16 with Prisma ORM (host `localhost:5433` $\rightarrow$ container `5432`)
- **Authentication**: Signed cryptographic sessions (`jose`), bcrypt password hashing, HTTP-only secure cookies
- **Security**: Stealth Admin route (`/secure-console-x7`) protected by server-side `requireAdmin()` guard
- **Media Storage**: S3-compatible Object Storage (Cloudflare R2 / AWS S3)
- **Deployment**: Vercel

---

## 3. The Golden Reading Loop
```text
English Sentence  ──>  Vietnamese Translation  ──>  Vocabulary Highlighting  ──>  Vocabulary Tooltip  ──>  Word Bank  ──>  Save Vocabulary  ──>  Reading History
```

---

## 4. Development Phases Roadmap

| Phase | Title | Status | Primary Output |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Project Discovery** | **COMPLETED** | Requirements, Architecture, Database Design, Security Spec, Risk Analysis |
| **Phase 1** | **Project Foundation** | **COMPLETED** | Next.js 15, TypeScript, Tailwind CSS, Shell Layout, Error Boundaries |
| **Phase 2** | **Database Implementation** | **COMPLETED** | PostgreSQL 16, Prisma Schema (14 entities), Migrations, Original Educational Seeder |
| **Phase 3** | **Authentication & Authorization** | **COMPLETED & VERIFIED** | Session Auth, bcrypt, `requireAdmin()`, Stealth Route Guard, Login/Register UX |
| **Phase 4** | **Private Admin CMS** | **COMPLETED & VERIFIED** | Stealth Admin Console (`/secure-console-x7`), Full CRUD, Offset Engine, 20 Tests |
| **Phase 5** | **Public Discovery & Content Browsing** | **PENDING (NEXT)** | Hero, Latest Articles Feed, Category Chips, CEFR Filters |
| **Phase 6** | **Article Reading Experience** | PENDING | Bilingual Sentence Reader, Translation Toggle, Progress Tracker |
| **Phase 7** | **Vocabulary & Word Bank** | PENDING | Offset-based Highlighting, Tooltip Popover, CEFR Word Bank Drawer |
| **Phase 8** | **Search & Filter** | PENDING | Full-text Article Search, Combined Filters, Autocomplete |
| **Phase 9** | **User Features** | PENDING | Saved Vocabulary Bank, Reading History, Favorites |
| **Phase 10** | **SEO, Accessibility & Performance** | PENDING | Metadata, JSON-LD Schemas, Sitemap, WCAG 2.1 AA Audit, Web Vitals |
| **Phase 11** | **Testing & Security Audit** | PENDING | Unit, Integration, E2E, Security Penetration, Dependency Audit |
| **Phase 12** | **Vercel Deployment** | PENDING | Production Database, Object Storage, Vercel Production Release |
| **Phase 13** | **Production Hardening** | PENDING | Observability, Logging, Disaster Recovery, Backup Strategy |

---

## 5. Critical Operating Principle
Every phase follows strictly:
```text
PLAN ──> CREATE IMPLEMENTATION PLAN ──> WAIT (USER APPROVAL) ──> IMPLEMENT ──> TEST ──> REVIEW ──> CREATE PHASE REPORT ──> REPORT ──> WAIT (USER APPROVAL)
```
