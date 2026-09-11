# PHASE 03 — IMPLEMENTATION PLAN

## 1. Phase Objective
Implement the production-grade authentication and authorization subsystem for **ReadToImprove**. Establish secure session management using HTTP-only cookies, password verification using `bcryptjs`, centralized role-based authorization (`requireAdmin()`, `requireAuth()`), the stealth admin route protection mechanism (`/secure-console-x7`), input validation via Zod, and full user authentication flows (login, register, logout, session status).

---

## 2. Scope
- Install and configure authentication and validation dependencies: `zod` (runtime schema validation) and `jose` (standards-compliant cryptographic JWT/JWE token signing).
- Implement centralized session & auth service in `src/lib/auth.ts`:
  - `auth()`: Server-side session verification reading HTTP-only cookie, verifying signature with `AUTH_SECRET`, and validating active user status in PostgreSQL via Prisma.
  - `loginAction(formData)`: Server Action with Zod validation, rate-limiting check, bcrypt password comparison, session issuance, and audit logging.
  - `registerAction(formData)`: Server Action allowing new English learners to create an account with role `USER`, strict password strength requirements, and immediate session issuance.
  - `logoutAction()`: Server Action clearing the authentication cookie.
- Implement server-side security guards in `src/lib/security.ts`:
  - `requireAuth()`: Enforces authenticated session; redirects or returns 401.
  - `requireAdmin()`: Enforces `role === 'ADMIN'` and `isActive === true`; returns 401 for unauthenticated or 403 Forbidden for non-admin users; logs security alert in `AuditLog`.
  - Rate limiting utility: Sliding window in-memory rate limiter protecting login endpoints against brute-force attacks.
- Build authentication UI routes:
  - `src/app/(auth)/login/page.tsx`: Accessible, responsive login page with client validation and error states.
  - `src/app/(auth)/register/page.tsx`: Accessible registration page for learners.
  - `src/app/(auth)/layout.tsx`: Auth layout shell.
- Protect the stealth Admin route (`/secure-console-x7`):
  - Implement `src/app/secure-console-x7/layout.tsx` enforcing `requireAdmin()`.
  - Implement `src/app/secure-console-x7/page.tsx` basic protected dashboard displaying active admin identity, roles, and security audit metrics.
  - Enforce `robots.ts` disallowing crawler access to `/secure-console-x7/*`.
  - Verify zero DOM leakage of `/secure-console-x7` in public layout, navigation, or footer.
- Update public `Header` to display user session state (login button if guest, user avatar/name + logout if authenticated; zero admin links).
- Implement automated verification test script `scripts/verify-auth.ts` testing:
  - Valid user login and session cookie issuance.
  - Password mismatch failure.
  - Non-existent user rejection.
  - Role differentiation (`USER` vs `ADMIN`).
  - Access control: guest $\rightarrow$ 401/redirect; regular `USER` $\rightarrow$ 403 Forbidden; `ADMIN` $\rightarrow$ 200 OK.
  - Rate-limiting protection against brute force.
  - Audit logging of unauthorized admin attempts.

---

## 3. Out of Scope
- Full Admin CMS CRUD interfaces for Articles, Sentences, and Categories (Reserved for **Phase 4**).
- Public article bilingual reader interface (Reserved for **Phase 6 & 7**).
- Personal Word Bank and Reading History user dashboards (Reserved for **Phase 9**).
- Third-party OAuth providers (Google/Facebook) until production credentials are provided.

---

## 4. Requirements Covered
- **BRD/FSD Section 6 & 7**: Single administrator model, stealth admin route (`/secure-console-x7`), defense-in-depth authorization (`authenticate()` $\rightarrow$ `requireAdmin()` $\rightarrow$ execute).
- **BRD/FSD Section 9**: Admin security (secure password hashing, HTTP-only cookies, rate limiting, audit logging, zero credential leakage).
- **BRD/FSD Section 10**: Admin account bootstrapping from environment variables.
- **BRD/FSD Section 11 & 14**: Role-based access control (`USER` vs `ADMIN`), server-side enforcement.
- **BRD/FSD Section 16**: Authenticated user accounts (learners).
- **BRD/FSD Section 21**: Phase 3 Authentication & Authorization roadmap.

---

## 5. Current Project State
- Next.js 15+ App Router application operational with Tailwind CSS and base layout (Phase 1).
- PostgreSQL 16 database running on port 5433 with 14 entities and seed data (Phase 2).
- Seed data contains 1 Admin user (`admin@readtoimprove.com`) and 1 Test user (`learner@example.com`) with bcrypt-hashed passwords.
- No authentication session handling, cookies, or login pages exist yet.

---

## 6. Existing Files Relevant To This Phase
- [src/lib/prisma.ts](file:///d:/readtoimprove/src/lib/prisma.ts) *(Database singleton client)*
- [prisma/schema.prisma](file:///d:/readtoimprove/prisma/schema.prisma) *(User and AuditLog models)*
- [docs/03_ADMIN_SECURITY_SPECIFICATION.md](file:///d:/readtoimprove/docs/03_ADMIN_SECURITY_SPECIFICATION.md) *(Authoritative security spec)*
- [src/components/common/header.tsx](file:///d:/readtoimprove/src/components/common/header.tsx) *(Public navigation bar to receive auth state)*
- [.env.local](file:///d:/readtoimprove/.env.local) *(Contains `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `ADMIN_ROUTE_PATH`)*

---

## 7. Technical Decisions
1. **Cryptographic Session Tokens with `jose`**:
   - Issue signed, tamper-proof JWT tokens signed with HMAC-SHA256 using `AUTH_SECRET`.
   - Token payload: `{ sub: user.id, email: user.email, role: user.role, name: user.name }`.
   - Stored in an `HttpOnly`, `Secure` (in production), `SameSite=Lax`, `Path=/` cookie with 7-day expiration.
   - Zero client-side script access to session tokens.
2. **Server Actions for Mutations**:
   - Use Next.js Server Actions (`loginAction`, `registerAction`, `logoutAction`) with automatic CSRF protection (Host/Origin header verification).
3. **Defense-in-Depth in Server Components**:
   - Every protected route performs real-time validation via `requireAdmin()` querying `prisma.user` to verify `isActive === true` and `role === 'ADMIN'`, ensuring instant revocation if a user is disabled or demoted.
4. **Stealth Admin Route Isolation**:
   - Located at `/secure-console-x7`.
   - Not linked in any navbar, footer, sitemap, or robots.txt.
   - Enforced by server-side `requireAdmin()`.
5. **Input Validation**:
   - All credentials and registration data validated strictly via Zod schemas before database interaction.

---

## 8. Architecture Changes
- Introduces `src/lib/auth.ts` (authentication service) and `src/lib/security.ts` (authorization guards & rate limiting).
- Adds `src/app/robots.ts` blocking crawlers from `/secure-console-x7/*` and `/api/admin/*`.
- Introduces `(auth)` route group for authentication UX.
- Introduces `secure-console-x7` protected route tree.

---

## 9. Folder / Module Structure
```text
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx         # Centered card layout for login/register
│   │   ├── login/
│   │   │   └── page.tsx       # Accessible login form
│   │   └── register/
│   │       └── page.tsx       # Accessible register form
│   ├── secure-console-x7/     # Stealth Admin Area
│   │   ├── layout.tsx         # Admin layout enforcing requireAdmin()
│   │   └── page.tsx           # Initial admin dashboard & security overview
│   ├── robots.ts              # Dynamic robots.txt blocking stealth admin
│   └── ...
├── components/
│   ├── auth/
│   │   ├── login-form.tsx     # Client form with Zod error feedback
│   │   └── register-form.tsx  # Client form for learner registration
│   └── common/
│       └── header.tsx         # Updated with session-aware user dropdown
├── lib/
│   ├── auth.ts                # Session verification, token signing, login/logout
│   ├── security.ts            # requireAdmin(), requireAuth(), rate limiting
│   └── validations/
│       └── auth.ts            # Zod schemas for login and registration
```

---

## 10. Files To Create
1. `src/validations/auth.ts`: Zod schemas for `loginSchema` and `registerSchema`.
2. `src/lib/auth.ts`: Token signing, cookie management, session retrieval (`auth()`), and actions.
3. `src/lib/security.ts`: `requireAdmin()`, `requireAuth()`, in-memory rate limiter, security audit logger.
4. `src/components/auth/login-form.tsx`: Interactive login form with loading states and error toasts.
5. `src/components/auth/register-form.tsx`: Interactive registration form.
6. `src/app/(auth)/layout.tsx`: Clean layout shell for auth pages.
7. `src/app/(auth)/login/page.tsx`: Login page route.
8. `src/app/(auth)/register/page.tsx`: Register page route.
9. `src/app/secure-console-x7/layout.tsx`: Admin guard layout invoking `requireAdmin()`.
10. `src/app/secure-console-x7/page.tsx`: Protected admin console homepage.
11. `src/app/robots.ts`: Next.js metadata route for `robots.txt` blocking crawlers.
12. `scripts/verify-auth.ts`: Automated 10-test authentication and authorization test suite.

---

## 11. Files To Modify
- [src/components/common/header.tsx](file:///d:/readtoimprove/src/components/common/header.tsx): Integrate session awareness (showing user profile / logout button; zero admin links).
- [package.json](file:///d:/readtoimprove/package.json): Add `zod` and `jose` dependencies.
- [IMPLEMENTATION_PLAN.md](file:///d:/readtoimprove/IMPLEMENTATION_PLAN.md): Update Phase 3 status.
- [PROJECT_STATUS.md](file:///d:/readtoimprove/PROJECT_STATUS.md): Update project status.

---

## 12. Database Changes
No new tables needed. Uses existing `User` and `AuditLog` entities implemented in Phase 2.

---

## 13. API / Server Changes
- Server Actions:
  - `loginAction(data)`: Validates credentials, sets session cookie.
  - `registerAction(data)`: Creates user, sets session cookie.
  - `logoutAction()`: Deletes session cookie.
- Server Guards:
  - `auth()`: Returns `Session | null`.
  - `requireAdmin()`: Returns `User` or throws 403 / redirects.

---

## 14. UI Changes
- Dedicated clean `/login` and `/register` pages with accessible form controls and validation messaging.
- Session-aware Header showing current learner profile or login CTA.
- Protected `/secure-console-x7` admin overview interface with system stats, role confirmation, and logout.

---

## 15. Security Considerations
- **Cookie Flags**: `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"`, `path: "/"`.
- **Brute Force Protection**: In-memory sliding window rate limiter allowing max 5 failed login attempts per 15 minutes per IP address.
- **Defense-in-Depth**: `requireAdmin()` queries the database in real-time, preventing stale JWT role elevation if an admin is revoked.
- **Audit Logging**: Any unauthorized attempt to invoke an admin mutation or access `/secure-console-x7` logs an `AuditLog` record with user IP and timestamp.
- **Zero Public Footprint**: Crawler disallowed in `robots.ts`, `<meta name="robots" content="noindex, nofollow" />` in admin layout, and zero admin navigation links in public DOM.

---

## 16. Environment Variables
Already configured in `.env` and `.env.local`:
```env
AUTH_SECRET="f4c6e9a8b1d2c3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8"
ADMIN_EMAIL="admin@readtoimprove.com"
ADMIN_INITIAL_PASSWORD="AdminDevSecret2026!ChangeMe"
ADMIN_ROUTE_PATH="/secure-console-x7"
```

---

## 17. Dependencies
### Production Dependencies to Add:
- `zod`: `^3.24.2` (Runtime schema validation)
- `jose`: `^5.9.6` (Lightweight, standard Web Cryptography JWT engine)

---

## 18. Implementation Steps

### Step 1: Install Dependencies
- Add `zod` and `jose` to `package.json` and run `npm install`.

### Step 2: Implement Zod Validation Schemas
- Create `src/validations/auth.ts` defining `loginSchema` and `registerSchema`.

### Step 3: Implement Auth Service & Token Engine
- Create `src/lib/auth.ts` with `signToken()`, `verifyToken()`, `setSessionCookie()`, `clearSessionCookie()`, and `auth()`.
- Implement `loginAction()`, `registerAction()`, and `logoutAction()`.

### Step 4: Implement Authorization Guards & Security Logger
- Create `src/lib/security.ts` with `requireAuth()`, `requireAdmin()`, rate limiter, and `logAudit()`.

### Step 5: Implement Authentication UX Components & Pages
- Create `src/components/auth/login-form.tsx` and `src/components/auth/register-form.tsx`.
- Create `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, and `src/app/(auth)/register/page.tsx`.

### Step 6: Implement Stealth Admin Console Guard & Route
- Create `src/app/robots.ts` disallowing `/secure-console-x7/*`.
- Create `src/app/secure-console-x7/layout.tsx` enforcing `requireAdmin()`.
- Create `src/app/secure-console-x7/page.tsx` displaying admin overview and session information.

### Step 7: Update Public Header for Session Awareness
- Update `src/components/common/header.tsx` to read session and show learner profile or login button.

### Step 8: Automated Verification Suite
- Create and run `scripts/verify-auth.ts` executing 10 comprehensive security and authentication test cases.
- Run regression checks: `npm run typecheck`, `npm run lint`, and `npm run build`.

---

## 19. Testing Strategy
- Automated programmatic test suite `scripts/verify-auth.ts` verifying:
  1. Valid Admin login with correct password generates valid signed token.
  2. Valid Learner login generates valid signed token with `USER` role.
  3. Invalid password fails with specific invalid credentials error.
  4. Non-existent email fails gracefully.
  5. `requireAuth()` rejects unauthenticated guest.
  6. `requireAdmin()` grants access to `ADMIN` user.
  7. `requireAdmin()` strictly denies access to `USER` role with 403.
  8. Disabled user (`isActive: false`) is rejected even with valid password.
  9. Rate limiter blocks rapid repeated failed login attempts.
  10. Unauthorized access attempt generates persistent `AuditLog` entry.
- Static checks: `npm run typecheck`, `npm run lint`, and `npm run build`.

---

## 20. Test Cases
| Case ID | Description | Validation Method | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Admin Authentication | `verify-auth.ts` | Valid Admin credentials return signed session with `role: ADMIN`. |
| **TC-AUTH-02** | Learner Authentication | `verify-auth.ts` | Valid Learner credentials return signed session with `role: USER`. |
| **TC-AUTH-03** | Invalid Password Rejection | `verify-auth.ts` | Incorrect password returns error; zero token issued. |
| **TC-AUTH-04** | Non-Existent User Rejection | `verify-auth.ts` | Unregistered email returns error; zero token issued. |
| **TC-AUTH-05** | Guest Access Rejection | `verify-auth.ts` | `requireAuth()` throws/redirects when session is null. |
| **TC-AUTH-06** | Admin Access Grant | `verify-auth.ts` | `requireAdmin()` returns user record for authenticated admin. |
| **TC-AUTH-07** | Non-Admin Role Rejection | `verify-auth.ts` | `requireAdmin()` throws 403 Forbidden for learner (`role: USER`). |
| **TC-AUTH-08** | Inactive User Rejection | `verify-auth.ts` | Disabled user (`isActive: false`) cannot obtain active session. |
| **TC-AUTH-09** | Rate Limiter Protection | `verify-auth.ts` | Exceeding 5 failed attempts triggers 429 Too Many Requests. |
| **TC-AUTH-10** | Security Audit Trail | `verify-auth.ts` | Unauthorized admin attempt creates `AuditLog` entry in database. |

---

## 21. Review Checklist
- [ ] Centralized server-side `requireAdmin()` enforced on all admin routes.
- [ ] Cookies configured with `HttpOnly`, `Secure`, and `SameSite=Lax`.
- [ ] Passwords hashed with `bcryptjs` (12 rounds).
- [ ] No plaintext passwords or secrets in logs or responses.
- [ ] Zero admin navigation links in public header, footer, or DOM.
- [ ] Dynamic `robots.ts` explicitly disallows stealth admin route.
- [ ] Input validation enforced via Zod on all auth actions.
- [ ] Rate limiting active on login endpoints.

---

## 22. Risks
| Risk | Severity | Mitigation |
| :--- | :--- | :--- |
| Stale JWT role elevation | High | `requireAdmin()` always performs real-time database validation of `role` and `isActive`. |
| Brute force credential guessing | Medium | In-memory sliding window rate limiter restricting failed attempts per IP. |
| Admin route accidental discovery | Low | Hidden URL + strict 401/403 server-side rejection + zero DOM leakage + robots blocking. |

---

## 23. Rollback / Recovery Strategy
- Authentication code is completely modular in `src/lib/auth.ts` and `src/lib/security.ts`.
- If an issue arises, rollback to git commit `efd58b3` (Phase 2).
- Session cookies can be invalidated globally at any time by rotating `AUTH_SECRET`.

---

## 24. Definition of Done
- [ ] Phase 3 Implementation Plan approved by user.
- [ ] `zod` and `jose` installed and configured.
- [ ] `src/lib/auth.ts` and `src/lib/security.ts` implemented.
- [ ] Login and Register forms and pages implemented and responsive.
- [ ] Protected stealth Admin route `/secure-console-x7` implemented with `requireAdmin()`.
- [ ] Crawler blocking in `src/app/robots.ts` implemented.
- [ ] Public Header updated with session awareness (zero admin links).
- [ ] `scripts/verify-auth.ts` passes all 10 security test cases.
- [ ] `npm run typecheck`, `npm run lint`, and `npm run build` pass with zero errors.
- [ ] `docs/phases/PHASE_03_REPORT.md` created.
- [ ] `PROJECT_STATUS.md` and `IMPLEMENTATION_PLAN.md` synchronized.

---

## 25. Approval Gate
STATUS: WAITING_FOR_APPROVAL
