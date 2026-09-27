# Vercel Preview Deployment Smoke Testing Checklist

**Project:** ReadToImprove  
**Phase:** 12 — Milestone 12B (Preview Verification)  
**Target:** Vercel Preview Deployment URL (`https://readtoimprove-*-username.vercel.app`)  

---

## 1. Automated Smoke Test Execution

Run the automated smoke test script targeting your live Vercel Preview URL:

```bash
npx tsx scripts/smoke-test.ts --url=https://<YOUR-PREVIEW-URL>.vercel.app
```

Verify that all 10 smoke test assertions pass:
- [ ] TC-SMOKE-01: Homepage HTTP 200 & Core DOM landmarks.
- [ ] TC-SMOKE-02: Production HTTP Security Headers (CSP, XFO, XCTO, Referrer-Policy, absence of X-Powered-By).
- [ ] TC-SMOKE-03: Sitemap XML Generation (`/sitemap.xml`).
- [ ] TC-SMOKE-04: Robots.txt crawler directives (`/robots.txt`).
- [ ] TC-SMOKE-05: Edge OpenGraph image generation (`/api/og`).
- [ ] TC-SMOKE-06: Articles catalog page (`/articles`).
- [ ] TC-SMOKE-07: Categories discovery page (`/categories`).
- [ ] TC-SMOKE-08: Search autocomplete suggestions API (`/api/search/suggestions`).
- [ ] TC-SMOKE-09: Stealth admin route protection (`/secure-console-x7`).
- [ ] TC-SMOKE-10: 404 page non-disclosure of internal stack traces.

---

## 2. Interactive User Experience Checklist

Test the following interactive user flows in a live browser window:

### A. Reader & Sentence Highlighting
- [ ] Navigate to `/articles/clean-energy-microgrids-urban-resilience`.
- [ ] Click on vocabulary words in English text -> Verify definition popover appears.
- [ ] Toggle translation mode (Off / English Only / All) -> Verify translation visibility changes instantly.
- [ ] Change font size (Small / Medium / Large) -> Verify responsive typography adjusts without layout shifts.

### B. Personal Word Bank (Authenticated Flow)
- [ ] Log in as a learner account.
- [ ] Click the Bookmark / Save icon next to a vocabulary word in the reader.
- [ ] Navigate to `/word-bank` -> Verify the word appears at the top of the list with correct CEFR badge and definition.
- [ ] Delete/unsave the word -> Verify removal is immediate.

### C. Search & Keyboard Navigation
- [ ] Press `Ctrl + K` (or `Cmd + K` on macOS) -> Verify search command palette opens with focus trapped inside.
- [ ] Type "energy" -> Verify instant suggestions appear with CEFR level pills.
- [ ] Press `Enter` -> Verify redirection to `/articles?q=energy` with filtered results.

### D. Responsive Design & Dark Mode
- [ ] Open DevTools responsive device mode at 375x667 (iPhone SE).
- [ ] Verify navigation collapses into mobile sheet menu.
- [ ] Toggle dark mode / light mode -> Verify text contrast remains $\ge 4.5:1$ across all badges.

---

## 3. Lighthouse Audit Performance Gate

Execute a Lighthouse audit in Chrome DevTools (or via Lighthouse CLI) on the Preview URL:

| Metric | Target Threshold | Measured Score | Status |
|---|:---:|:---:|:---:|
| **Performance** | $\ge 90$ | Pending live URL | - |
| **Accessibility** | $\ge 95$ | Pending live URL | - |
| **Best Practices** | $\ge 95$ | Pending live URL | - |
| **SEO** | $\ge 95$ | Pending live URL | - |

---

## 4. Promotion Sign-Off Gate

Once all checks above are confirmed:
1. Notify team / user with preview test results.
2. Receive user formal sign-off.
3. Proceed to Milestone 12C (Production Promotion).
