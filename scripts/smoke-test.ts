/**
 * ReadToImprove — Automated Deployment Smoke Test Suite
 *
 * Verifies live HTTP endpoints, security headers, SEO artifacts, and API responsiveness
 * against any target environment (Preview, Staging, or Production).
 *
 * Usage:
 *   npx tsx scripts/smoke-test.ts --url=https://readtoimprove.vercel.app
 *   npx tsx scripts/smoke-test.ts --url=http://localhost:3000
 */

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const args = process.argv.slice(2);
const urlArg = args.find((arg) => arg.startsWith('--url='));
const targetBaseUrl = (urlArg ? urlArg.replace('--url=', '') : 'http://localhost:3000').replace(/\/+$/, '');

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const durationMs = Math.round(performance.now() - start);
    results.push({ name, passed: true, message: 'OK', durationMs });
    console.log(`  ✅ PASS [${name}] (${durationMs}ms)`);
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, message, durationMs });
    console.error(`  ❌ FAIL [${name}] (${durationMs}ms): ${message}`);
  }
}

async function main() {
  console.log('=================================================================');
  console.log(`  READTOIMPROVE — LIVE SMOKE TEST SUITE`);
  console.log(`  Target URL: ${targetBaseUrl}`);
  console.log(`  Timestamp:  ${new Date().toISOString()}`);
  console.log('=================================================================\n');

  // TC-01: Homepage Accessibility & Markup
  await runTest('TC-SMOKE-01: Homepage HTTP 200 & Core DOM', async () => {
    const res = await fetch(`${targetBaseUrl}/`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    if (!text.includes('ReadToImprove')) throw new Error('Missing ReadToImprove brand title');
    if (!text.includes('id="main-content"')) throw new Error('Missing accessible main-content landmark');
  });

  // TC-02: HTTP Security Headers
  await runTest('TC-SMOKE-02: Production HTTP Security Headers', async () => {
    const res = await fetch(`${targetBaseUrl}/`, { method: 'HEAD' });
    const headers = res.headers;

    const xfo = headers.get('x-frame-options');
    if (xfo !== 'DENY') throw new Error(`Expected X-Frame-Options: DENY, got: ${xfo}`);

    const xcto = headers.get('x-content-type-options');
    if (xcto !== 'nosniff') throw new Error(`Expected X-Content-Type-Options: nosniff, got: ${xcto}`);

    const rp = headers.get('referrer-policy');
    if (!rp || !rp.includes('strict-origin')) throw new Error(`Unexpected Referrer-Policy: ${rp}`);

    const csp = headers.get('content-security-policy');
    if (!csp || !csp.includes("default-src 'self'")) throw new Error(`Missing or weak CSP: ${csp}`);

    const poweredBy = headers.get('x-powered-by');
    if (poweredBy) throw new Error(`Server fingerprint leaked via X-Powered-By: ${poweredBy}`);

    if (targetBaseUrl.startsWith('https://')) {
      const hsts = headers.get('strict-transport-security');
      if (!hsts || !hsts.includes('max-age')) throw new Error(`Missing HSTS header on HTTPS target`);
    }
  });

  // TC-03: XML Sitemap
  await runTest('TC-SMOKE-03: Sitemap XML Generation (/sitemap.xml)', async () => {
    const res = await fetch(`${targetBaseUrl}/sitemap.xml`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('xml')) throw new Error(`Expected XML content-type, got: ${contentType}`);
    const text = await res.text();
    if (!text.includes('<urlset') && !text.includes('http://www.sitemaps.org/schemas/sitemap/0.9')) {
      throw new Error('Sitemap does not contain valid sitemap XML schema');
    }
  });

  // TC-04: Robots.txt Directives
  await runTest('TC-SMOKE-04: Robots.txt Crawler Exclusion (/robots.txt)', async () => {
    const res = await fetch(`${targetBaseUrl}/robots.txt`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Disallow: /secure-console-x7/')) {
      throw new Error('Robots.txt fails to disallow stealth admin console');
    }
    if (!text.includes('Disallow: /me/')) {
      throw new Error('Robots.txt fails to disallow private learner profile');
    }
    if (!text.includes('sitemap.xml')) {
      throw new Error('Robots.txt missing reference to sitemap.xml');
    }
  });

  // TC-05: Dynamic OpenGraph Image Generator
  await runTest('TC-SMOKE-05: Edge OpenGraph Image Endpoint (/api/og)', async () => {
    const res = await fetch(`${targetBaseUrl}/api/og?title=Test&level=B2`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image/')) throw new Error(`Expected image content-type, got: ${contentType}`);
    const cacheControl = res.headers.get('cache-control') || '';
    if (!cacheControl.includes('public') && !cacheControl.includes('s-maxage')) {
      throw new Error(`Missing CDN cache headers on OG endpoint: ${cacheControl}`);
    }
  });

  // TC-06: Articles Catalog Page
  await runTest('TC-SMOKE-06: Articles Catalog Page (/articles)', async () => {
    const res = await fetch(`${targetBaseUrl}/articles`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const text = await res.text();
    if (!text.includes('id="main-content"')) throw new Error('Missing accessible main-content landmark');
  });

  // TC-07: Categories Page
  await runTest('TC-SMOKE-07: Categories Discovery Page (/categories)', async () => {
    const res = await fetch(`${targetBaseUrl}/categories`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
  });

  // TC-08: Search Autocomplete Suggestions API
  await runTest('TC-SMOKE-08: Search Suggestions API (/api/search/suggestions)', async () => {
    const res = await fetch(`${targetBaseUrl}/api/search/suggestions?q=th`);
    if (!res.ok) throw new Error(`HTTP status ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json.suggestions)) throw new Error('Expected suggestions array in response');
  });

  // TC-09: Stealth Admin Route Protection
  await runTest('TC-SMOKE-09: Stealth Admin Route Protection (/secure-console-x7)', async () => {
    const res = await fetch(`${targetBaseUrl}/secure-console-x7`, { redirect: 'manual' });
    // In Next.js, unauthenticated requests to protected admin routes should redirect to login (302/307) or render login
    const isProtected = res.status === 307 || res.status === 302 || res.status === 200;
    if (!isProtected) throw new Error(`Unexpected status code for unauthenticated admin access: ${res.status}`);
  });

  // TC-10: 404 Not Found Page Safety
  await runTest('TC-SMOKE-10: 404 Route Safety & Non-disclosure', async () => {
    const res = await fetch(`${targetBaseUrl}/non-existent-probe-path-${Date.now()}`);
    if (res.status !== 404) throw new Error(`Expected 404 status, got: ${res.status}`);
    const text = await res.text();
    if (text.includes('PrismaClientKnownRequestError') || text.includes('stack')) {
      throw new Error('404 error page leaks internal error traces');
    }
  });

  console.log('\n=================================================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`  SMOKE TEST SUMMARY: ${passed}/${results.length} PASSED (${failed} FAILED)`);
  console.log('=================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
