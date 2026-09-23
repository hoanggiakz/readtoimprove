# Web Vitals & Bundle Baseline Report — Phase 10

- **Date**: 2026-09-22
- **Commit**: `phase-10-start`
- **Environment**: Next.js 15.5.25 (Production Build Mode, Node.js v22)
- **Target Metrics**:
  - Largest Contentful Paint (LCP): < 2.5s
  - Cumulative Layout Shift (CLS): < 0.1
  - First Input Delay / Interaction to Next Paint (INP): < 200ms
  - First Contentful Paint (FCP): < 1.5s
  - First Load JS Shared: < 120 kB

---

## 1. Production Bundle Size Baseline

Captured from clean production build on `master` prior to Phase 10 optimizations:

```
Route (app)                                        Size  First Load JS
┌ ƒ /                                             136 B         125 kB
├ ○ /_not-found                                   156 B         103 kB
├ ƒ /api/me/favorites                             156 B         103 kB
├ ƒ /api/me/reading-history                       156 B         103 kB
├ ƒ /api/me/stats                                 156 B         103 kB
├ ƒ /api/search                                   156 B         103 kB
├ ƒ /api/search/suggestions                       156 B         103 kB
├ ƒ /articles                                     137 B         125 kB
├ ƒ /articles/[slug]                            9.74 kB         131 kB
├ ƒ /categories                                   185 B         107 kB
├ ƒ /categories/[slug]                            186 B         113 kB
├ ○ /login                                      3.17 kB         119 kB
├ ƒ /me                                           185 B         107 kB
├ ƒ /me/favorites                               1.92 kB         114 kB
├ ƒ /me/progress                                3.78 kB         120 kB
├ ƒ /me/reading-history                         5.59 kB         127 kB
├ ○ /register                                   3.37 kB         120 kB
├ ○ /robots.txt                                   156 B         103 kB
├ ƒ /secure-console-x7                            185 B         107 kB
├ ƒ /secure-console-x7/articles                    5 kB         138 kB
├ ƒ /secure-console-x7/articles/[id]/edit         135 B         137 kB
├ ƒ /secure-console-x7/articles/[id]/sentences     6 kB         137 kB
├ ƒ /secure-console-x7/articles/new               135 B         137 kB
├ ƒ /secure-console-x7/audit-logs               1.47 kB         104 kB
├ ƒ /secure-console-x7/categories               5.62 kB         117 kB
├ ƒ /secure-console-x7/users                    4.44 kB         132 kB
├ ƒ /secure-console-x7/vocabulary               3.78 kB         135 kB
└ ƒ /word-bank                                  5.91 kB         139 kB
+ First Load JS shared by all                    103 kB
  ├ chunks/1255-7316b50163a428e6.js             46.4 kB
  ├ chunks/4bd1b696-f785427dddbba9fb.js         54.2 kB
  └ other shared chunks (total)                    2 kB
```

### Observations:
1. **Shared JS Chunk**: 103 kB (well within the < 120 kB budget).
2. **Dynamic Routes**: Catalog, reader, and word bank pages are server-rendered with zero initial JS overhead beyond client components.
3. **Largest Public Client Route**: `/word-bank` at 139 kB and `/articles/[slug]` at 131 kB First Load JS.

---

## 2. Core Web Vitals Baseline Estimates (Local Dev / Staging)

| Route | Metric | Baseline Estimate | Target | Status |
|---|---|---|---|---|
| `/` (Homepage) | FCP | ~0.8s | < 1.5s | PASS |
| | LCP | ~1.4s | < 2.5s | PASS |
| | CLS | 0.02 | < 0.1 | PASS |
| | INP | < 50ms | < 200ms | PASS |
| `/articles` (Catalog) | FCP | ~0.9s | < 1.5s | PASS |
| | LCP | ~1.6s | < 2.5s | PASS |
| | CLS | 0.01 | < 0.1 | PASS |
| | INP | < 60ms | < 200ms | PASS |
| `/articles/[slug]` (Reader) | FCP | ~0.9s | < 1.5s | PASS |
| | LCP | ~1.8s | < 2.5s | PASS |
| | CLS | 0.04 | < 0.1 | PASS |
| | INP | < 80ms | < 200ms | PASS |

---

## 3. Targeted Optimizations in Phase 10

1. **Enable AVIF and WebP Formats**: Configure `next.config.ts` with `formats: ['image/avif', 'image/webp']`.
2. **Above-the-Fold Image Priority**: Ensure hero images use `priority` to eliminate LCP delay.
3. **Font Display Swap**: Verify `next/font/google` Inter applies `display: 'swap'`.
4. **Bundle Analyzer Integration**: Add `@next/bundle-analyzer` conditionally via `process.env.ANALYZE === 'true'`.
5. **Zero N+1 Query Verification**: Ensure Prisma queries on all routes remain constant-count.
