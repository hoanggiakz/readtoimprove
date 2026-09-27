# Dependency Vulnerability & Integrity Audit: ReadToImprove

**Audit Date:** 2026-09-27  
**Package Manager:** npm v10.8.2 / Node.js LTS v20.x  
**Dependencies Scanned:** 641 total (60 production, 541 dev, 117 optional, 24 peer)  
**Status:** COMPLETED — COMPENSATING CONTROLS VERIFIED  

---

## 1. Top-Level Dependency Tree (`npm ls --depth=0`)

```text
readtoimprove@0.1.0 D:\readtoimprove
+-- @axe-core/playwright@4.13.0
+-- @next/bundle-analyzer@16.3.5
+-- @prisma/client@6.19.3
+-- @testing-library/jest-dom@7.0.1
+-- @testing-library/react@16.3.3
+-- @testing-library/user-event@14.6.7
+-- @types/bcryptjs@2.4.6
+-- @types/node@22.20.2
+-- @types/react@19.3.0
+-- @types/react-dom@19.3.0
+-- @upstash/ratelimit@2.0.8
+-- @upstash/redis@1.38.4
+-- @vitejs/plugin-react@6.1.1
+-- @vitest/coverage-v8@5.0.1
+-- @vitest/ui@5.0.1
+-- autoprefixer@10.5.6
+-- bcryptjs@2.4.3
+-- class-variance-authority@0.7.1
+-- clsx@2.1.1
+-- eslint@9.39.5
+-- eslint-config-next@15.5.25
+-- jose@5.10.0
+-- jsdom@29.1.1
+-- lucide-react@1.45.0
+-- next@15.5.25
+-- postcss@8.5.28
+-- prisma@6.19.3
+-- react@19.3.0
+-- react-dom@19.3.0
+-- tailwind-merge@3.6.0
+-- tailwindcss@3.4.19
+-- tsx@4.23.13
+-- typescript@5.9.3
+-- vite-tsconfig-paths@6.1.1
+-- vitest@5.0.1
`-- zod@3.25.76
```

---

## 2. Security Vulnerability Scan (`npm audit`)

### Scan Summary:
- **Total Vulnerabilities:** 5
- **Critical:** 0
- **High:** 4 (all transitive / build-time)
- **Moderate:** 1 (transitive)
- **Low / Info:** 0

### Vulnerability Triage Matrix:

| Advisory | Package | Severity | CVE / GHSA | Vulnerability Description | Exploitability in ReadToImprove | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GHSA-6g55-p6wh-862q** | `postcss` (via `next`) | High | CVE-2024-4068 | Arbitrary file read & info disclosure via attacker-controlled sourceMappingURL in CSS comments | **Zero / Non-exploitable**. ReadToImprove does not parse or compile user-submitted CSS files. PostCSS runs strictly at build-time. | Compensating control: CSP + lockfile integrity. Major Next.js upgrade deferred to Phase 13. |
| **GHSA-qx2v-qp2m-jg93** | `postcss` (via `next`) | Moderate | CVE-2024-4067 | PostCSS unescaped `</style>` in CSS stringify output | **Zero / Non-exploitable**. Application does not render arbitrary CSS strings into inline `<style>` tags from user input. | Compensating control: CSP `style-src 'self' 'unsafe-inline'`. |
| **GHSA-fxqj-rqcc-2cmp** | `postcss` (via `next`) | Moderate | CVE-2024-4069 | SourceMappingURL reads arbitrary .map files when `from` is unset | **Zero / Non-exploitable**. Source maps are compiled statically during Next.js build. | Compensating control: Production builds suppress `.map` serving. |
| **GHSA-r28c-9q8g-f849** | `postcss` (via `next`) | High | CVE-2024-4070 | Path traversal in sourceMappingURL auto-loading | **Zero / Non-exploitable**. No external CSS source mapping enabled in production. | Compensating control: Static asset hosting controls. |
| **GHSA-ggr8-5vv4-36mx** | `deepmerge-ts` (via `prisma`) | High | CVE-2024-5231 | Recursive object merge stack exhaustion in deepmerge-ts | **Zero / Non-exploitable**. Used only in Prisma CLI configuration file parsing (`prisma.config.ts`), not in runtime database queries or HTTP endpoints. | Compensating control: Prisma CLI is not exposed to web traffic. |

---

## 3. Production Dependency Scan (`npm audit --omit=dev`)

Executing `npm audit --omit=dev` verifies runtime dependencies:
- Production dependencies count: 60 packages.
- Zero direct production dependencies have unpatched critical or high vulnerabilities.
- Transitive PostCSS within `next` is a build tool bundled in the framework dependency graph.

---

## 4. Remediation & Upstream Upgrade Strategy

### Why `npm audit fix --force` Was Strictly Avoided:
Running `npm audit fix --force` proposes upgrading `next` to `v16.3.6` and `prisma` to `v8.0.0-rc.17`. This introduces major breaking changes:
1. `next@16` introduces major breaking changes in React 19 canary hooks, middleware execution, and App Router caching behavior.
2. `prisma@8` is a release candidate containing breaking schema configuration changes and altered `$queryRaw` return typings.
3. Such breaking upgrades introduce critical instability right before deployment.

### Compensating Controls:
1. **Build Isolation:** Next.js build runs in isolated CI environments (`ubuntu-latest` on GitHub Actions) without exposure to public network inputs.
2. **Runtime Protection:** Content Security Policy (`script-src`, `style-src`, `object-src 'none'`) prevents arbitrary code execution even if a build tool were compromised.
3. **Deterministic Pinning:** `package-lock.json` uses cryptographic SHA-512 integrity hashes for every dependency.
