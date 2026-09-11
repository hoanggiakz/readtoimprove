# PHASE 01 — IMPLEMENTATION PLAN

## 1. Phase Objective
Establish the foundational Next.js application infrastructure for **ReadToImprove** in accordance with the Phase 0 Architecture and Discovery specifications. This provides a robust, type-safe, accessible, and performant baseline (Next.js 15+ App Router, TypeScript, Tailwind CSS, shadcn/ui design tokens, Lucide Icons, base layout shell, error/loading boundaries, and environment management) before subsequent database and business logic implementation.

---

## 2. Scope
- Initialize Git version control with proper `.gitignore` for Next.js, Node.js, and environment secrets.
- Scaffold the Next.js 15+ App Router application with TypeScript, Tailwind CSS, ESLint, and `@/*` path aliases.
- Establish the modular directory structure under `src/` conforming to `docs/01_ARCHITECTURE_SPECIFICATION.md`.
- Configure the design system, typography, color palettes (including CEFR level indicators B1, B2, C1, C2), and dark/light theme variables.
- Install and configure foundational UI utility packages: `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react`.
- Build the initial application shell:
  - Root layout (`src/app/layout.tsx`) with Inter/Geist fonts, viewport, and metadata.
  - Public layout shell (`src/app/(public)/layout.tsx`) with accessible Header, Navbar, and Footer.
  - Global Error Boundary (`src/app/error.tsx`), Not Found page (`src/app/not-found.tsx`), and Loading Skeleton (`src/app/loading.tsx`).
  - Landing page shell (`src/app/(public)/page.tsx`) demonstrating theme tokens and platform identity.
- Establish environment variable contract via `.env.example`.
- Verify build, type checking, and linting pipelines.

---

## 3. Out of Scope
- Database schema migrations and Prisma client setup (Reserved for **Phase 2**).
- User authentication and session handling (Reserved for **Phase 3**).
- Admin CMS dashboard, CRUD mutations, and protected management routes (Reserved for **Phase 4**).
- Bilingual reading experience with sentence-level interactive highlighting (Reserved for **Phase 6 & 7**).
- Full-text search and filtering engine (Reserved for **Phase 8**).

---

## 4. Requirements Covered
- **BRD/FSD Section 4**: Frontend Technology Stack (Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui primitives, Lucide Icons).
- **BRD/FSD Section 5 & 8**: Modular Monolith foundation with clean domain boundaries.
- **BRD/FSD Section 19**: Accessibility baseline (semantic HTML, skip-to-content link, WCAG 2.1 AA compliant color tokens).
- **BRD/FSD Section 21**: Phase 1 Project Foundation requirements.
- **BRD/FSD Section 33 & 53**: Git hygiene, `.gitignore`, and `.env.example` secret protection.

---

## 5. Current Project State
- Directory `d:\readtoimprove` contains:
  - `README.md` (Project overview and documentation index)
  - `docs/00_DISCOVERY_AND_REQUIREMENTS.md`
  - `docs/01_ARCHITECTURE_SPECIFICATION.md`
  - `docs/02_DATABASE_SCHEMA_DESIGN.md`
  - `docs/03_ADMIN_SECURITY_SPECIFICATION.md`
  - `docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md`
  - `docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md`
- No package.json, node_modules, or Git repository exists yet.
- Host environment: Node.js `v24.13.0`, npm `11.6.2`, Docker `29.4.3`, Git `2.52.0.windows.1`.

---

## 6. Existing Files Relevant To This Phase
- [README.md](file:///d:/readtoimprove/README.md)
- [docs/01_ARCHITECTURE_SPECIFICATION.md](file:///d:/readtoimprove/docs/01_ARCHITECTURE_SPECIFICATION.md)
- [docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md](file:///d:/readtoimprove/docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md)

---

## 7. Technical Decisions
1. **Next.js Version**: Use Next.js 15+ with App Router and React 19 for maximum Server Component support and optimal initial paint.
2. **Directory Structure (`src/`)**: Use `src/app/`, `src/components/`, `src/lib/`, `src/services/`, `src/types/`, `src/validations/` as specified in Phase 0 Architecture.
3. **Route Grouping**: Use `(public)` route group to separate public reader views from future `(auth)` and stealth admin routes without polluting URL path segments.
4. **Tailwind CSS & Design Tokens**: Configure standard CSS variables for HSL colors, semantic tokens, and CEFR level color coding (`cefr-b1`, `cefr-b2`, `cefr-c1`, `cefr-c2`).
5. **Class Utility**: Implement standard `cn()` helper utilizing `clsx` and `tailwind-merge` for predictable conditional class composition.

---

## 8. Architecture Changes
None. Fully conforms to the Modular Monolith architecture approved in Phase 0.

---

## 9. Folder / Module Structure
```text
src/
├── app/
│   ├── (public)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── error.tsx
│   ├── global-error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── common/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── theme-toggle.tsx
│   └── ui/
│       ├── button.tsx
│       └── badge.tsx
├── lib/
│   ├── cefr.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── validations/
```

---

## 10. Files To Create
1. `.gitignore`: Ignore `node_modules`, `.next`, `.env*` (except `.env.example`), logs, build outputs.
2. `.env.example`: Safe placeholder template for required environment variables.
3. `package.json`: Project scripts (`dev`, `build`, `start`, `lint`, `typecheck`).
4. `tsconfig.json`: Strict TypeScript configuration with `@/*` paths mapped to `./src/*`.
5. `tailwind.config.ts`: Tailwind configuration with custom theme tokens, typography, and CEFR color utilities.
6. `postcss.config.mjs`: PostCSS configuration for Tailwind.
7. `next.config.ts`: Next.js production configuration.
8. `src/app/globals.css`: Tailwind directives, CSS custom properties for light/dark theme and CEFR tokens.
9. `src/lib/utils.ts`: `cn()` helper function combining `clsx` and `tailwind-merge`.
10. `src/lib/cefr.ts`: CEFR level types, label mappings, and badge styling helpers.
11. `src/components/ui/button.tsx`: Accessible button component using `class-variance-authority`.
12. `src/components/ui/badge.tsx`: Accessible badge component supporting CEFR and status variants.
13. `src/components/common/header.tsx`: Accessible site header with branding, navigation links, and theme toggle.
14. `src/components/common/footer.tsx`: Accessible site footer with attribution, legal, and copyright compliance notice.
15. `src/app/layout.tsx`: Root HTML layout with font loading, metadata, and skip-to-content link.
16. `src/app/(public)/layout.tsx`: Public shell wrapping children with Header and Footer.
17. `src/app/(public)/page.tsx`: Initial landing page showcasing platform purpose and design system tokens.
18. `src/app/loading.tsx`: Loading skeleton fallback for streaming page transitions.
19. `src/app/error.tsx`: Client-side error boundary with recovery mechanism.
20. `src/app/not-found.tsx`: Accessible 404 page with return-home navigation.
21. `src/types/index.ts`: Core type definitions for navigation, theme, and CEFR.

---

## 11. Files To Modify
- [README.md](file:///d:/readtoimprove/README.md): Update setup instructions and phase progress.
- [PROJECT_STATUS.md](file:///d:/readtoimprove/PROJECT_STATUS.md): Synchronize state to Phase 1.
- [IMPLEMENTATION_PLAN.md](file:///d:/readtoimprove/IMPLEMENTATION_PLAN.md): Keep global roadmap aligned.

---

## 12. Database Changes
None during Phase 1.

---

## 13. API / Server Changes
None during Phase 1.

---

## 14. UI Changes
- Establish base responsive layout with desktop ($\ge 1200\text{px}$), tablet ($768 - 1199\text{px}$), and mobile ($< 768\text{px}$) support.
- Header with logo, navigation links, and theme toggle.
- Clean semantic Footer highlighting educational copyright compliance and attribution.
- Landing hero section explaining the "Golden Reading Loop" with interactive CEFR badge demonstrations.

---

## 15. Security Considerations
- `.gitignore` strictly configured to block `.env`, `.env.local`, and credential files.
- `.env.example` contains only non-sensitive dummy placeholders.
- Content Security: No inline unsafe scripts; all styles managed via CSS variables and Tailwind.
- Zero admin references in public markup, links, or navigation.

---

## 16. Environment Variables
Placeholder variables to be documented in `.env.example`:
```env
# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ReadToImprove"

# Database (For Phase 2)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readtoimprove?schema=public"

# Authentication (For Phase 3)
AUTH_SECRET="replace-with-generated-secret-minimum-32-chars"
ADMIN_EMAIL="admin@readtoimprove.com"
ADMIN_INITIAL_PASSWORD="ChangeMeInProduction2026!"
ADMIN_ROUTE_PATH="/secure-console-x7"

# Storage (For Phase 4)
STORAGE_ENDPOINT=""
STORAGE_ACCESS_KEY=""
STORAGE_SECRET_KEY=""
STORAGE_BUCKET=""
```

---

## 17. Dependencies
### Core Dependencies:
- `next`: `^15.2.0` (or latest stable compatible)
- `react`: `^19.0.0`
- `react-dom`: `^19.0.0`
- `clsx`: `^2.1.1`
- `tailwind-merge`: `^3.0.2`
- `class-variance-authority`: `^0.7.1`
- `lucide-react`: `^1.16.0`

### Dev Dependencies:
- `typescript`: `^5.7.3`
- `@types/node`: `^22.13.0`
- `@types/react`: `^19.0.8`
- `@types/react-dom`: `^19.0.3`
- `tailwindcss`: `^4.0.0` or `^3.4.17`
- `postcss`: `^8.5.1`
- `eslint`: `^9.20.0`
- `eslint-config-next`: `^15.2.0`

---

## 18. Implementation Steps

### Step 1: Git Repository & Environment Protection
- Initialize git repository (`git init`).
- Create comprehensive `.gitignore` preventing secret leaks.
- Create `.env.example` with clear documentation.

### Step 2: Package Manifest & Dependency Installation
- Create `package.json` with build and verification scripts: `dev`, `build`, `start`, `lint`, `typecheck`.
- Install dependencies using npm with strict version integrity.

### Step 3: TypeScript & Build Configuration
- Create `tsconfig.json` with strict type checking and `@/*` path mapping.
- Create `next.config.ts` and `postcss.config.mjs`.

### Step 4: Styling & Design System
- Configure `tailwind.config.ts` with custom colors, animations, and CEFR utilities.
- Implement `src/app/globals.css` with CSS custom properties for light/dark themes and typography.
- Create `src/lib/utils.ts` with `cn()` utility.
- Create `src/lib/cefr.ts` with CEFR color and badge helpers.

### Step 5: Base UI Primitives & Components
- Implement accessible `Button` and `Badge` components.
- Implement `Header`, `Footer`, and `ThemeToggle` components.

### Step 6: Layout Shell & Error Boundaries
- Implement `src/app/layout.tsx` with semantic HTML5 hierarchy and skip link.
- Implement `src/app/(public)/layout.tsx`.
- Implement `src/app/(public)/page.tsx`.
- Implement `src/app/loading.tsx`, `src/app/error.tsx`, and `src/app/not-found.tsx`.

### Step 7: Verification & Build Testing
- Execute `npm run typecheck` to verify complete TypeScript type safety.
- Execute `npm run lint` to verify code standards.
- Execute `npm run build` to verify Next.js production build succeeds without errors.

---

## 19. Testing Strategy
- Static Type Checking: `npm run typecheck` (`tsc --noEmit`).
- Static Code Analysis: `npm run lint` (`next lint`).
- Production Compilation: `npm run build` to ensure all Server Components and client boundaries compile into static/SSR chunks.
- Visual & Responsive Sanity Check: Test rendering at desktop ($\ge 1200\text{px}$), tablet ($768\text{px}$), and mobile ($375\text{px}$).

---

## 20. Test Cases
| Case ID | Description | Expected Outcome |
| :--- | :--- | :--- |
| **TC-01** | `npm run typecheck` | Clean exit code 0; 0 type errors. |
| **TC-02** | `npm run lint` | Clean exit code 0; 0 ESLint warnings/errors. |
| **TC-03** | `npm run build` | Next.js compilation succeeds with optimized chunks. |
| **TC-04** | Not Found handling | Navigating to `/non-existent` loads custom `not-found.tsx`. |
| **TC-05** | Error boundary | Simulated error triggers `error.tsx` with reset button. |
| **TC-06** | Responsive layout | Header and footer remain fully responsive without horizontal scrollbar. |

---

## 21. Review Checklist
- [ ] No hardcoded secrets in version control.
- [ ] TypeScript strict mode enabled and passing.
- [ ] No `any` types used in new code.
- [ ] Server Component vs Client Component boundaries properly respected.
- [ ] WCAG 2.1 AA contrast ratios maintained in color system.
- [ ] Zero public links or references to stealth admin route.

---

## 22. Risks
| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Next.js / React 19 dependency peer warning | Low | Use compatible version pinning in `package.json`. |
| CSS layout shifts during font loading | Low | Use Next.js `next/font/google` with `display: swap`. |

---

## 23. Rollback / Recovery Strategy
Since Phase 1 creates new project files on an empty repository without modifying existing Phase 0 documentation, rollback can be achieved cleanly via `git checkout` or reverting newly created files.

---

## 24. Definition of Done
- [ ] Git repository initialized with `.gitignore` and initial commit.
- [ ] `.env.example` created and documented.
- [ ] Next.js 15+ App Router application scaffolded and configured.
- [ ] TypeScript, Tailwind CSS, and UI tokens functional.
- [ ] Base layout, Header, Footer, and error boundaries implemented.
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm run build` produces successful production build.
- [ ] Phase 1 Report file `docs/phases/PHASE_01_REPORT.md` prepared upon completion.

---

## 25. Approval Gate
STATUS: WAITING_FOR_APPROVAL
