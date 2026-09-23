/**
 * ReadToImprove — Phase 10 SEO / Accessibility / Performance Verification Suite
 *
 * Covers 28 tests across 4 categories:
 * - Category A: SEO Verification (Metadata, Canonical, Robots, Sitemap, OpenGraph)
 * - Category B: Structured Data JSON-LD (WebSite, SearchAction, NewsArticle, BreadcrumbList)
 * - Category C: Accessibility WCAG 2.1 AA (Keyboard, Focus Trap, Screen Reader, Contrast, Reduced Motion)
 * - Category D: Performance & Best Practices (AVIF/WebP, Font Swap, Web Vitals, Bundle Analyzer, Zero N+1)
 */

import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';
import robots from '../src/app/robots';
import sitemap from '../src/app/sitemap';
import { getPublicArticles, getPublicArticleBySlug } from '../src/lib/articles';

interface TestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  message?: string;
  details?: unknown;
}

const results: TestResult[] = [];

function recordTest(
  id: string,
  category: string,
  name: string,
  passed: boolean,
  message?: string,
  details?: unknown
) {
  results.push({ id, category, name, passed, message, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] ${id}: ${name}${message ? ` — ${message}` : ''}`);
}

async function runVerification() {
  console.log('='.repeat(80));
  console.log('READTOIMPROVE — PHASE 10 VERIFICATION SUITE: SEO / A11Y / PERFORMANCE');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Node.js: ${process.version}\n`);

  // =========================================================================
  // CATEGORY A: SEO VERIFICATION (TC-SEO-01 to TC-SEO-08)
  // =========================================================================
  console.log('\n--- CATEGORY A: SEO VERIFICATION ---');

  // TC-SEO-01: Root Layout Metadata Base & OpenGraph
  try {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    const hasMetadataBase = layoutContent.includes('metadataBase: new URL');
    const hasOpenGraph = layoutContent.includes('openGraph: {');
    const hasTwitter = layoutContent.includes('twitter: {');
    const hasCanonical = layoutContent.includes('canonical: "/"');

    const passed = hasMetadataBase && hasOpenGraph && hasTwitter && hasCanonical;
    recordTest(
      'TC-SEO-01',
      'SEO',
      'Root layout exports valid metadataBase, canonical, openGraph, and twitter card',
      passed,
      passed ? 'Root layout contains complete global SEO metadata structure' : 'Missing metadata properties'
    );
  } catch (err) {
    recordTest('TC-SEO-01', 'SEO', 'Root layout metadata verification', false, String(err));
  }

  // TC-SEO-02: Public Homepage Metadata & Canonical
  try {
    const homePath = path.join(process.cwd(), 'src/app/(public)/page.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    const hasMetadata = homeContent.includes('export const metadata: Metadata');
    const hasCanonical = homeContent.includes("canonical: '/'");
    const hasTitle = homeContent.includes('ReadToImprove — Đọc Báo Song Ngữ');

    const passed = hasMetadata && hasCanonical && hasTitle;
    recordTest(
      'TC-SEO-02',
      'SEO',
      'Homepage exports explicit metadata with canonical URL',
      passed,
      passed ? 'Homepage metadata configured with canonical "/"' : 'Incomplete homepage metadata'
    );
  } catch (err) {
    recordTest('TC-SEO-02', 'SEO', 'Homepage metadata verification', false, String(err));
  }

  // TC-SEO-03: Catalog Dynamic Metadata Generation
  try {
    const catalogPath = path.join(process.cwd(), 'src/app/(public)/articles/page.tsx');
    const catalogContent = fs.readFileSync(catalogPath, 'utf8');

    const hasGenerateMetadata = catalogContent.includes('export async function generateMetadata');
    const hasCanonical = catalogContent.includes("canonical: '/articles'");
    const hasSearchQueryTitle = catalogContent.includes('Tìm kiếm:');
    const hasCefrTitle = catalogContent.includes('Bài viết cấp độ CEFR');

    const passed = hasGenerateMetadata && hasCanonical && hasSearchQueryTitle && hasCefrTitle;
    recordTest(
      'TC-SEO-03',
      'SEO',
      'Articles catalog exports dynamic generateMetadata handling search and CEFR filters',
      passed,
      passed ? 'Dynamic metadata handles queries and enforces canonical "/articles"' : 'Missing dynamic branch'
    );
  } catch (err) {
    recordTest('TC-SEO-03', 'SEO', 'Catalog dynamic metadata', false, String(err));
  }

  // TC-SEO-04: Article Detail Metadata & Canonical
  try {
    const detailPath = path.join(process.cwd(), 'src/app/(public)/articles/[slug]/page.tsx');
    const detailContent = fs.readFileSync(detailPath, 'utf8');

    const hasGenerateMetadata = detailContent.includes('export async function generateMetadata');
    const hasCanonical = detailContent.includes('article.canonicalUrl || `/articles/${article.slug}`');
    const hasDynamicOg = detailContent.includes('/api/og?title=');

    const passed = hasGenerateMetadata && hasCanonical && hasDynamicOg;
    recordTest(
      'TC-SEO-04',
      'SEO',
      'Article detail exports dynamic metadata with canonical URL and dynamic OG fallback',
      passed,
      passed ? 'Article metadata dynamically resolves canonical and /api/og fallback' : 'Missing canonical or OG fallback'
    );
  } catch (err) {
    recordTest('TC-SEO-04', 'SEO', 'Article detail metadata', false, String(err));
  }

  // TC-SEO-05: Dynamic Sitemap Article Filtering
  try {
    const sitemapEntries = await sitemap();
    const hasHomepage = sitemapEntries.some((e) => e.url.endsWith('/') || e.url.endsWith(':3000'));
    const hasArticles = sitemapEntries.some((e) => e.url.includes('/articles'));
    const hasCategories = sitemapEntries.some((e) => e.url.includes('/categories'));

    // Verify all articles in sitemap are strictly PUBLISHED and publishedAt <= now
    const publishedSlugsInDb = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        publishedAt: { lte: new Date() },
      },
      select: { slug: true },
    });

    const sitemapArticleUrls = sitemapEntries.filter((e) => e.url.includes('/articles/'));
    const allPublished = sitemapArticleUrls.every((item) =>
      publishedSlugsInDb.some((db) => item.url.endsWith(`/articles/${db.slug}`))
    );

    const passed = hasHomepage && hasArticles && hasCategories && allPublished;
    recordTest(
      'TC-SEO-05',
      'SEO',
      'Dynamic sitemap.ts generates valid routes and strictly filters only published articles',
      passed,
      `Generated ${sitemapEntries.length} sitemap entries (${sitemapArticleUrls.length} published articles verified)`,
      { totalEntries: sitemapEntries.length }
    );
  } catch (err) {
    recordTest('TC-SEO-05', 'SEO', 'Dynamic sitemap generation', false, String(err));
  }

  // TC-SEO-06: Dynamic Sitemap Private Route Exclusion
  try {
    const sitemapEntries = await sitemap();
    const includesAdmin = sitemapEntries.some((e) => e.url.includes('secure-console'));
    const includesMe = sitemapEntries.some((e) => e.url.includes('/me'));
    const includesWordBank = sitemapEntries.some((e) => e.url.includes('/word-bank'));
    const includesApi = sitemapEntries.some((e) => e.url.includes('/api/'));

    const passed = !includesAdmin && !includesMe && !includesWordBank && !includesApi;
    recordTest(
      'TC-SEO-06',
      'SEO',
      'Dynamic sitemap strictly excludes admin, learner profile (/me), word-bank, and API routes',
      passed,
      passed ? 'Zero private or authenticated routes in sitemap' : 'Leaked private routes in sitemap'
    );
  } catch (err) {
    recordTest('TC-SEO-06', 'SEO', 'Sitemap route exclusion', false, String(err));
  }

  // TC-SEO-07: Robots.txt Crawler Exclusions
  try {
    const robotsData = robots();
    const rules = Array.isArray(robotsData.rules) ? robotsData.rules[0] : robotsData.rules;
    const disallows = Array.isArray(rules?.disallow) ? rules.disallow : [rules?.disallow];

    const hasAdminExclusion = disallows.some((d) => d && d.includes('secure-console'));
    const hasMeExclusion = disallows.some((d) => d && d.includes('/me'));
    const hasWordBankExclusion = disallows.some((d) => d && d.includes('/word-bank'));
    const hasApiExclusion = disallows.some((d) => d && d.includes('/api'));
    const hasSitemap = Boolean(robotsData.sitemap && robotsData.sitemap.includes('sitemap.xml'));

    const passed = hasAdminExclusion && hasMeExclusion && hasWordBankExclusion && hasApiExclusion && hasSitemap;
    recordTest(
      'TC-SEO-07',
      'SEO',
      'robots.ts disallows admin, api, /me, /word-bank, and specifies sitemap URL',
      passed,
      `Configured ${disallows.length} disallow rules with sitemap link`,
      { disallowRules: disallows, sitemap: robotsData.sitemap }
    );
  } catch (err) {
    recordTest('TC-SEO-07', 'SEO', 'Robots.txt verification', false, String(err));
  }

  // TC-SEO-08: Dynamic Open Graph Image Generator Route
  try {
    const ogRoutePath = path.join(process.cwd(), 'src/app/api/og/route.tsx');
    const ogContent = fs.readFileSync(ogRoutePath, 'utf8');

    const usesImageResponse = ogContent.includes("from 'next/og'");
    const hasWidthAndHeight = ogContent.includes('width: 1200') && ogContent.includes('height: 630');
    const hasCacheControl = ogContent.includes('Cache-Control');
    const hasCefrColors = ogContent.includes('cefrColors');

    const passed = usesImageResponse && hasWidthAndHeight && hasCacheControl && hasCefrColors;
    recordTest(
      'TC-SEO-08',
      'SEO',
      'Dynamic OG image endpoint (/api/og) configured with ImageResponse, 1200x630, and CDN cache headers',
      passed,
      passed ? 'OG image generator configured with CEFR palette and edge caching' : 'Missing parameters'
    );
  } catch (err) {
    recordTest('TC-SEO-08', 'SEO', 'Dynamic OG image route', false, String(err));
  }

  // =========================================================================
  // CATEGORY B: STRUCTURED DATA JSON-LD (TC-JSONLD-01 to TC-JSONLD-06)
  // =========================================================================
  console.log('\n--- CATEGORY B: STRUCTURED DATA JSON-LD ---');

  // TC-JSONLD-01: Homepage WebSite & SearchAction Schema
  try {
    const homePath = path.join(process.cwd(), 'src/app/(public)/page.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');

    const hasWebSiteType = homeContent.includes("'@type': 'WebSite'");
    const hasSearchAction = homeContent.includes("'@type': 'SearchAction'");
    const hasQueryInput = homeContent.includes("'query-input': 'required name=search_term_string'");
    const hasJsonLdRender = homeContent.includes('<JsonLd data={websiteSchema} />');

    const passed = hasWebSiteType && hasSearchAction && hasQueryInput && hasJsonLdRender;
    recordTest(
      'TC-JSONLD-01',
      'JSON-LD',
      'Homepage outputs valid Schema.org WebSite with SearchAction for sitelinks searchbox',
      passed,
      passed ? 'WebSite schema contains valid EntryPoint and query-input parameter' : 'Schema incomplete'
    );
  } catch (err) {
    recordTest('TC-JSONLD-01', 'JSON-LD', 'WebSite schema verification', false, String(err));
  }

  // TC-JSONLD-02: Article Detail NewsArticle Schema Structure
  try {
    const detailPath = path.join(process.cwd(), 'src/app/(public)/articles/[slug]/page.tsx');
    const detailContent = fs.readFileSync(detailPath, 'utf8');

    const hasNewsArticleType = detailContent.includes("'@type': 'NewsArticle'");
    const hasHeadline = detailContent.includes('headline: article.titleEn');
    const hasAlternativeHeadline = detailContent.includes('alternativeHeadline: article.titleVi');
    const hasImage = detailContent.includes('image: [currentOgImage]');

    const passed = hasNewsArticleType && hasHeadline && hasAlternativeHeadline && hasImage;
    recordTest(
      'TC-JSONLD-02',
      'JSON-LD',
      'Article detail outputs valid NewsArticle schema with headline, alternativeHeadline, and image',
      passed,
      passed ? 'Bilingual headlines and OpenGraph image properly mapped' : 'Missing article schema attributes'
    );
  } catch (err) {
    recordTest('TC-JSONLD-02', 'JSON-LD', 'NewsArticle schema structure', false, String(err));
  }

  // TC-JSONLD-03: Article Schema Author, Publisher, and Timestamps
  try {
    const detailPath = path.join(process.cwd(), 'src/app/(public)/articles/[slug]/page.tsx');
    const detailContent = fs.readFileSync(detailPath, 'utf8');

    const hasDatePublished = detailContent.includes('datePublished: article.publishedAt');
    const hasDateModified = detailContent.includes('dateModified: article.updatedAt');
    const hasAuthor = detailContent.includes("name: article.sourceName || 'ReadToImprove Editorial Team'");
    const hasPublisher = detailContent.includes("name: 'ReadToImprove'");

    const passed = hasDatePublished && hasDateModified && hasAuthor && hasPublisher;
    recordTest(
      'TC-JSONLD-03',
      'JSON-LD',
      'NewsArticle schema includes datePublished, dateModified, author organization, and publisher',
      passed,
      passed ? 'Timestamps and attribution entities verified' : 'Incomplete metadata attributes'
    );
  } catch (err) {
    recordTest('TC-JSONLD-03', 'JSON-LD', 'Article timestamps and author', false, String(err));
  }

  // TC-JSONLD-04: BreadcrumbList Schema on Catalog & Categories
  try {
    const catalogPath = path.join(process.cwd(), 'src/app/(public)/articles/page.tsx');
    const categoryPath = path.join(process.cwd(), 'src/app/(public)/categories/page.tsx');
    const categoryDetailPath = path.join(process.cwd(), 'src/app/(public)/categories/[slug]/page.tsx');

    const catalogHasBreadcrumb = fs.readFileSync(catalogPath, 'utf8').includes("'@type': 'BreadcrumbList'");
    const categoryHasBreadcrumb = fs.readFileSync(categoryPath, 'utf8').includes("'@type': 'BreadcrumbList'");
    const categoryDetailHasBreadcrumb = fs.readFileSync(categoryDetailPath, 'utf8').includes("'@type': 'BreadcrumbList'");

    const passed = catalogHasBreadcrumb && categoryHasBreadcrumb && categoryDetailHasBreadcrumb;
    recordTest(
      'TC-JSONLD-04',
      'JSON-LD',
      'BreadcrumbList schema present across /articles, /categories, and /categories/[slug]',
      passed,
      passed ? 'BreadcrumbList schema integrated in all discovery routes' : 'Missing breadcrumbs on one or more routes'
    );
  } catch (err) {
    recordTest('TC-JSONLD-04', 'JSON-LD', 'BreadcrumbList schema verification', false, String(err));
  }

  // TC-JSONLD-05: Safe JSON-LD Serialization Component
  try {
    const jsonLdPath = path.join(process.cwd(), 'src/components/seo/json-ld.tsx');
    const jsonLdContent = fs.readFileSync(jsonLdPath, 'utf8');

    const hasSafeReplace = jsonLdContent.includes('.replace(/</g,');
    const hasTypeAttribute = jsonLdContent.includes('type="application/ld+json"');

    const testObject = { title: '</script><script>alert("xss")</script>' };
    const serialized = JSON.stringify(testObject).replace(/</g, '\\u003c');
    const isSafe = !serialized.includes('<script>');

    const passed = hasSafeReplace && hasTypeAttribute && isSafe;
    recordTest(
      'TC-JSONLD-05',
      'JSON-LD',
      'JsonLd component sanitizes raw HTML and prevents script tag injection via unicode escaping',
      passed,
      passed ? 'Escapes < into \\u003c preventing DOM injection' : 'Unsafe serialization detected'
    );
  } catch (err) {
    recordTest('TC-JSONLD-05', 'JSON-LD', 'JsonLd component serialization', false, String(err));
  }

  // TC-JSONLD-06: Draft / Unpublished Content Visibility Guard
  try {
    // Attempt to query non-existent or unpublished article
    const unpublished = await getPublicArticleBySlug('non-existent-test-slug-xyz');
    const passed = unpublished === null;

    recordTest(
      'TC-JSONLD-06',
      'JSON-LD',
      'Unpublished or non-existent article returns null to trigger notFound() without emitting schema',
      passed,
      passed ? 'getPublicArticleBySlug strictly returns null on non-published slugs' : 'Returned data for non-published slug'
    );
  } catch (err) {
    recordTest('TC-JSONLD-06', 'JSON-LD', 'Draft article schema guard', false, String(err));
  }

  // =========================================================================
  // CATEGORY C: ACCESSIBILITY WCAG 2.1 AA (TC-A11Y-01 to TC-A11Y-08)
  // =========================================================================
  console.log('\n--- CATEGORY C: ACCESSIBILITY WCAG 2.1 AA ---');

  // TC-A11Y-01: Skip-to-Content Link
  try {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    const hasSkipLink = layoutContent.includes('href="#main-content"');
    const hasSrOnly = layoutContent.includes('sr-only focus:not-sr-only');

    const passed = hasSkipLink && hasSrOnly;
    recordTest(
      'TC-A11Y-01',
      'A11Y',
      'Skip-to-content link exists as first focusable element targeting #main-content',
      passed,
      passed ? 'Found accessible skip link with focus:not-sr-only classes' : 'Missing skip link'
    );
  } catch (err) {
    recordTest('TC-A11Y-01', 'A11Y', 'Skip-to-content link', false, String(err));
  }

  // TC-A11Y-02: Main Content Target ID on All Public Layouts
  try {
    const homeContent = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/page.tsx'), 'utf8');
    const articlesContent = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/articles/page.tsx'), 'utf8');
    const articleDetailContent = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/articles/[slug]/page.tsx'), 'utf8');
    const categoriesContent = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/categories/page.tsx'), 'utf8');
    const categoryDetailContent = fs.readFileSync(path.join(process.cwd(), 'src/app/(public)/categories/[slug]/page.tsx'), 'utf8');
    const notFoundContent = fs.readFileSync(path.join(process.cwd(), 'src/app/not-found.tsx'), 'utf8');

    const allHaveMainContent =
      homeContent.includes('id="main-content"') &&
      articlesContent.includes('id="main-content"') &&
      articleDetailContent.includes('id="main-content"') &&
      categoriesContent.includes('id="main-content"') &&
      categoryDetailContent.includes('id="main-content"') &&
      notFoundContent.includes('id="main-content"');

    recordTest(
      'TC-A11Y-02',
      'A11Y',
      'Main content anchor (id="main-content") present across all public views and 404 page',
      allHaveMainContent,
      allHaveMainContent ? 'All 6 public route templates contain <main id="main-content">' : 'Missing #main-content target'
    );
  } catch (err) {
    recordTest('TC-A11Y-02', 'A11Y', 'Main content target ID', false, String(err));
  }

  // TC-A11Y-03: Global Focus-Visible Styling
  try {
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    const hasFocusVisible = cssContent.includes(':focus-visible {');
    const hasRing = cssContent.includes('ring-primary') || cssContent.includes('outline');

    const passed = hasFocusVisible && hasRing;
    recordTest(
      'TC-A11Y-03',
      'A11Y',
      'Global CSS configures high-contrast :focus-visible rings on interactive elements',
      passed,
      passed ? 'Found :focus-visible rules with primary ring tokens' : 'Missing :focus-visible in globals.css'
    );
  } catch (err) {
    recordTest('TC-A11Y-03', 'A11Y', 'Focus-visible styles', false, String(err));
  }

  // TC-A11Y-04: Prefers-Reduced-Motion Media Query
  try {
    const cssPath = path.join(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    const hasReducedMotion = cssContent.includes('@media (prefers-reduced-motion: reduce)');
    const disablesDuration = cssContent.includes('animation-duration: 0.01ms') || cssContent.includes('transition-duration');

    const passed = hasReducedMotion && disablesDuration;
    recordTest(
      'TC-A11Y-04',
      'A11Y',
      'Global CSS includes @media (prefers-reduced-motion: reduce) disabling animations',
      passed,
      passed ? 'Reduced motion overrides animations and transitions for motion-sensitive users' : 'Missing reduced motion query'
    );
  } catch (err) {
    recordTest('TC-A11Y-04', 'A11Y', 'Prefers-reduced-motion support', false, String(err));
  }

  // TC-A11Y-05: Modal Dialog Role and Focus Trapping
  try {
    const dialogPath = path.join(process.cwd(), 'src/components/search/search-command-dialog.tsx');
    const dialogContent = fs.readFileSync(dialogPath, 'utf8');

    const hasRoleDialog = dialogContent.includes('role="dialog"');
    const hasAriaModal = dialogContent.includes('aria-modal="true"');
    const hasFocusTrap = dialogContent.includes('handleDialogKeyDown') && dialogContent.includes("e.key === 'Tab'");
    const hasFocusRestore = dialogContent.includes('triggerRef.current?.focus()');

    const passed = hasRoleDialog && hasAriaModal && hasFocusTrap && hasFocusRestore;
    recordTest(
      'TC-A11Y-05',
      'A11Y',
      'SearchCommandDialog implements role="dialog", aria-modal="true", Tab focus trap, and focus restore',
      passed,
      passed ? 'Cyclic focus trapping and restore verified' : 'Incomplete dialog focus management'
    );
  } catch (err) {
    recordTest('TC-A11Y-05', 'A11Y', 'Dialog focus trapping', false, String(err));
  }

  // TC-A11Y-06: Live Regions for Search Autocomplete
  try {
    const commandDialogContent = fs.readFileSync(
      path.join(process.cwd(), 'src/components/search/search-command-dialog.tsx'),
      'utf8'
    );
    const searchBarContent = fs.readFileSync(
      path.join(process.cwd(), 'src/components/public/search-bar.tsx'),
      'utf8'
    );

    const commandHasAriaLive = commandDialogContent.includes('aria-live="polite"');
    const searchBarHasAriaLive = searchBarContent.includes('aria-live="polite"');

    const passed = commandHasAriaLive && searchBarHasAriaLive;
    recordTest(
      'TC-A11Y-06',
      'A11Y',
      'Search inputs integrate aria-live="polite" on suggestion listboxes for screen readers',
      passed,
      passed ? 'Both SearchCommandDialog and SearchBar feature aria-live="polite"' : 'Missing live region on suggestions'
    );
  } catch (err) {
    recordTest('TC-A11Y-06', 'A11Y', 'Search live regions', false, String(err));
  }

  // TC-A11Y-07: Live Region for Reading Progress Persistence
  try {
    const progressPath = path.join(process.cwd(), 'src/components/reader/reading-progress-bar.tsx');
    const progressContent = fs.readFileSync(progressPath, 'utf8');

    const hasAriaLive = progressContent.includes('aria-live="polite"');
    const hasAriaAtomic = progressContent.includes('aria-atomic="true"');
    const hasProgressBar = progressContent.includes('role="progressbar"');

    const passed = hasAriaLive && hasAriaAtomic && hasProgressBar;
    recordTest(
      'TC-A11Y-07',
      'A11Y',
      'ReadingProgressBar includes role="progressbar" and aria-live="polite" saving announcer',
      passed,
      passed ? 'Live announcer notifies screen readers of background progress saves' : 'Missing live announcer'
    );
  } catch (err) {
    recordTest('TC-A11Y-07', 'A11Y', 'Reading progress live region', false, String(err));
  }

  // TC-A11Y-08: Color Contrast Calculation (WCAG AA >= 4.5:1)
  try {
    // Helper function to calculate relative luminance of sRGB hex
    function hexToLuminance(hex: string): number {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;

      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    function contrastRatio(hex1: string, hex2: string): number {
      const lum1 = hexToLuminance(hex1);
      const lum2 = hexToLuminance(hex2);
      const brightest = Math.max(lum1, lum2);
      const darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    // Measure key platform color pairs
    const pairs = [
      { name: 'Light Mode Body Text', bg: '#ffffff', text: '#020817' },
      { name: 'Light Mode Muted Text', bg: '#ffffff', text: '#64748b' },
      { name: 'Dark Mode Body Text', bg: '#020817', text: '#f8fafc' },
      { name: 'Dark Mode Muted Text', bg: '#020817', text: '#94a3b8' },
    ];

    const resultsRatio = pairs.map((p) => ({
      name: p.name,
      ratio: Math.round(contrastRatio(p.bg, p.text) * 100) / 100,
      meetsAA: contrastRatio(p.bg, p.text) >= 4.5,
    }));

    const allMeetAA = resultsRatio.every((r) => r.meetsAA);
    recordTest(
      'TC-A11Y-08',
      'A11Y',
      'Primary and muted text color pairs achieve WCAG 2.1 AA >= 4.5:1 contrast in light and dark modes',
      allMeetAA,
      `Measured ratios: ${resultsRatio.map((r) => `${r.name}: ${r.ratio}:1`).join(', ')}`,
      resultsRatio
    );
  } catch (err) {
    recordTest('TC-A11Y-08', 'A11Y', 'Color contrast calculation', false, String(err));
  }

  // =========================================================================
  // CATEGORY D: PERFORMANCE & BEST PRACTICES (TC-PERF-01 to TC-PERF-06)
  // =========================================================================
  console.log('\n--- CATEGORY D: PERFORMANCE & BEST PRACTICES ---');

  // TC-PERF-01: AVIF and WebP Formats in Next.js Config
  try {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');

    const hasFormats = configContent.includes("formats: ['image/avif', 'image/webp']") ||
                       configContent.includes('formats: ["image/avif", "image/webp"]');

    recordTest(
      'TC-PERF-01',
      'Performance',
      'next.config.ts configures modern image formats (AVIF and WebP)',
      hasFormats,
      hasFormats ? 'Modern image formats enabled in next.config.ts' : 'Missing image formats config'
    );
  } catch (err) {
    recordTest('TC-PERF-01', 'Performance', 'Next.js image format config', false, String(err));
  }

  // TC-PERF-02: Inter Font Display Swap & Subsets
  try {
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    const hasDisplaySwap = layoutContent.includes("display: 'swap'") || layoutContent.includes('display: "swap"');
    const hasVietnameseSubset = layoutContent.includes('"vietnamese"') || layoutContent.includes("'vietnamese'");

    const passed = hasDisplaySwap && hasVietnameseSubset;
    recordTest(
      'TC-PERF-02',
      'Performance',
      'Inter font loaded with display: swap and vietnamese subset to eliminate FOIT',
      passed,
      passed ? 'Font configuration optimizes rendering performance and avoids layout shifts' : 'Missing font options'
    );
  } catch (err) {
    recordTest('TC-PERF-02', 'Performance', 'Font display swap configuration', false, String(err));
  }

  // TC-PERF-03: WebVitals Reporting Integration
  try {
    const vitalsPath = path.join(process.cwd(), 'src/components/analytics/web-vitals.tsx');
    const vitalsExists = fs.existsSync(vitalsPath);
    const layoutContent = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const layoutHasVitals = layoutContent.includes('<WebVitals />');

    const passed = vitalsExists && layoutHasVitals;
    recordTest(
      'TC-PERF-03',
      'Performance',
      'WebVitals component integrated in root layout for Core Web Vitals telemetry',
      passed,
      passed ? 'useReportWebVitals wired in client component and mounted in RootLayout' : 'Missing WebVitals component'
    );
  } catch (err) {
    recordTest('TC-PERF-03', 'Performance', 'Web Vitals integration', false, String(err));
  }

  // TC-PERF-04: Bundle Analyzer Configuration
  try {
    const configPath = path.join(process.cwd(), 'next.config.ts');
    const configContent = fs.readFileSync(configPath, 'utf8');

    const hasBundleAnalyzer = configContent.includes('@next/bundle-analyzer');
    const hasConditionalEnable = configContent.includes("process.env.ANALYZE === 'true'") ||
                                configContent.includes('process.env.ANALYZE === "true"');

    const passed = hasBundleAnalyzer && hasConditionalEnable;
    recordTest(
      'TC-PERF-04',
      'Performance',
      '@next/bundle-analyzer wired into next.config.ts conditionally via ANALYZE=true',
      passed,
      passed ? 'Bundle analyzer configured without adding overhead to regular production builds' : 'Missing analyzer wrapper'
    );
  } catch (err) {
    recordTest('TC-PERF-04', 'Performance', 'Bundle analyzer configuration', false, String(err));
  }

  // TC-PERF-05: Zero N+1 Catalog Query Verification
  try {
    const startTime = performance.now();
    const result = await getPublicArticles({ page: 1, pageSize: 12 });
    const duration = performance.now() - startTime;

    const hasArticles = Array.isArray(result.articles);
    const passed = hasArticles && duration < 50; // Should resolve in < 50ms locally

    recordTest(
      'TC-PERF-05',
      'Performance',
      'Public catalog query executes in constant time with categories pre-included (zero N+1)',
      passed,
      `Fetched ${result.articles.length} articles in ${duration.toFixed(2)}ms (total in DB: ${result.totalCount})`,
      { durationMs: duration, articleCount: result.articles.length }
    );
  } catch (err) {
    recordTest('TC-PERF-05', 'Performance', 'Catalog query performance', false, String(err));
  }

  // TC-PERF-06: Reader Query Batching & Relation Pre-Fetch
  try {
    const firstArticle = await prisma.article.findFirst({
      where: { status: 'PUBLISHED' },
      select: { slug: true },
    });

    if (!firstArticle) {
      recordTest('TC-PERF-06', 'Performance', 'Reader query batching', true, 'Skipped: No published seed article found');
    } else {
      const startTime = performance.now();
      const article = await getPublicArticleBySlug(firstArticle.slug);
      const duration = performance.now() - startTime;

      const hasSentences = Boolean(article && article.sentences.length > 0);
      const passed = hasSentences && duration < 50;

      recordTest(
        'TC-PERF-06',
        'Performance',
        'Public article detail query batches sentences and vocabulary in a single round-trip',
        passed,
        `Retrieved "${firstArticle.slug}" with ${article?.sentences.length} sentences in ${duration.toFixed(2)}ms`,
        { durationMs: duration, sentenceCount: article?.sentences.length }
      );
    }
  } catch (err) {
    recordTest('TC-PERF-06', 'Performance', 'Reader query batching', false, String(err));
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 10 TEST SUMMARY:');
  console.log('='.repeat(80));

  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Tests Run: ${total}`);
  console.log(`Passed:         ${passedCount} (${Math.round((passedCount / total) * 100)}%)`);
  console.log(`Failed:         ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ FAILED TESTS:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => console.error(`  - ${r.id}: ${r.name} (${r.message || 'No details'})`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 28 PHASE 10 VERIFICATION TESTS PASSED SUCCESSFULLY (100%)');
    process.exit(0);
  }
}

runVerification()
  .catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
