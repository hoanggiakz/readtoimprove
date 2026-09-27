# HTTP Security Headers Specification & Verification: ReadToImprove

**Date:** 2026-09-27  
**Configuration Location:** `next.config.ts` (`async headers()`)  
**Scope:** Global (`/:path*`), applying to all static assets, dynamic server routes, and API endpoints.  

---

## 1. Configured Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.upstash.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];
```

---

## 2. Header-by-Header Rationale

### 1. `Content-Security-Policy` (CSP)
- **Directive:** `default-src 'self'`
  - Restricts resource loading to the origin domain by default, blocking unauthorized third-party scripts, styles, and frames.
- **Directive:** `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
  - Allows Next.js core hydration scripts and dynamic client bundle chunks while prohibiting external scripts from untrusted domains.
- **Directive:** `style-src 'self' 'unsafe-inline'`
  - Required by Tailwind CSS runtime utility classes and dynamic reader font sizing / theme switching.
- **Directive:** `img-src 'self' data: blob: https:`
  - Allows local public images, base64 data URIs for inline SVGs, and authenticated HTTPS external article hero thumbnails.
- **Directive:** `connect-src 'self' https://*.upstash.io`
  - Restricts client and server fetch calls to the origin and Upstash Redis rate-limiting REST endpoints.
- **Directive:** `frame-ancestors 'none'`
  - Prevents embedding the site in any `<iframe>`, `<frame>`, or `<object>`, fully preventing Clickjacking attacks across modern browsers.
- **Directive:** `base-uri 'self'`
  - Restricts the URLs that can appear in a document's `<base>` element, preventing attackers from injecting `<base href>` to hijack relative links.
- **Directive:** `form-action 'self'`
  - Prevents form submissions from sending sensitive authentication data to unauthorized external endpoints.

---

### 2. `Strict-Transport-Security` (HSTS)
- **Value:** `max-age=63072000; includeSubDomains; preload`
- **Rationale:** Instructs modern browsers to communicate strictly over encrypted HTTPS for the next 2 years (63,072,000 seconds), including all subdomains, and qualifies the domain for the Google Chrome HSTS Preload list. Eliminates SSL-stripping and man-in-the-middle attacks.

---

### 3. `X-Frame-Options`
- **Value:** `DENY`
- **Rationale:** Legacy Clickjacking mitigation ensuring compatibility with older browsers that do not fully support CSP `frame-ancestors 'none'`.

---

### 4. `X-Content-Type-Options`
- **Value:** `nosniff`
- **Rationale:** Prevents MIME-type sniffing where a browser might treat a non-executable file (e.g. an image or plain text) as executable JavaScript, mitigating cross-site script inclusion (XSSI).

---

### 5. `Referrer-Policy`
- **Value:** `strict-origin-when-cross-origin`
- **Rationale:** Sends the full URL as a referrer when making same-origin requests, but only sends the origin (e.g. `https://readtoimprove.com`) when navigating to external websites, and sends no referrer when navigating from HTTPS to HTTP. Prevents leaking query parameters or private paths to external services.

---

### 6. `Permissions-Policy`
- **Value:** `camera=(), microphone=(), geolocation=(), browsing-topics=()`
- **Rationale:** Explicitly disables sensitive browser APIs and hardware capabilities that ReadToImprove does not use, preventing unauthorized surveillance, location tracking, or third-party ad topic extraction.

---

### 7. Suppression of `X-Powered-By`
- **Configuration:** `poweredByHeader: false` in `next.config.ts`.
- **Rationale:** Removes server technology fingerprinting from HTTP response headers, preventing automated scanners from easily identifying the exact Next.js framework version.
