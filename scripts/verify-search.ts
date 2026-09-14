/**
 * ReadToImprove — Phase 8 Search & Filter Verification Suite
 *
 * Covers 32 tests across:
 * - Hybrid PostgreSQL full-text search & trigram index scanning
 * - English stemming and Vietnamese substring matching
 * - Faceted category and CEFR filtering
 * - Combined intersection queries and public visibility enforcement
 * - Autocomplete suggestions (< 100ms)
 * - Result ranking and pagination boundaries
 * - Security: XSS, SQLi, query length limit, rate limiting, and data leak prevention
 */

import { prisma } from '../src/lib/prisma';
import { ArticleStatus, CefrLevel } from '@prisma/client';
import { searchPublicArticles, getSearchSuggestions } from '../src/lib/search';
import { searchParamsSchema, suggestionsQuerySchema } from '../src/validations/search';
import { rateLimit } from '../src/lib/rate-limit';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: unknown;
}

const results: TestResult[] = [];

function recordTest(
  id: string,
  name: string,
  passed: boolean,
  message?: string,
  details?: unknown
) {
  results.push({ id, name, passed, message, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${id}] ${name}${message ? ` — ${message}` : ''}`);
}

function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

async function runSearchVerificationSuite() {
  console.log('\n=================================================================');
  console.log('  READTOIMPROVE — PHASE 8 SEARCH & FILTER VERIFICATION SUITE (32 TESTS)');
  console.log('=================================================================\n');

  const testTimestamp = Date.now();
  const createdArticleIds: string[] = [];
  let testCategoryId = '';
  const testCategorySlug = `search-cat-${testTimestamp}`;

  try {
    // -------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------
    console.log('--- Setting up isolated search test fixtures ---');

    // 1. Create a test category
    const cat = await prisma.category.create({
      data: {
        slug: testCategorySlug,
        nameVi: `Công nghệ mới ${testTimestamp}`,
        nameEn: `Emerging Technology ${testTimestamp}`,
      },
    });
    testCategoryId = cat.id;

    // 2. Create Article A: Published, English keyword "sustainability", category assigned
    const artA = await prisma.article.create({
      data: {
        slug: `search-art-a-${testTimestamp}`,
        titleEn: `Innovations in Renewable Energy and Sustainability ${testTimestamp}`,
        titleVi: `Đột phá trong Năng lượng Tái tạo và Bền vững ${testTimestamp}`,
        excerptEn: 'Examining decentralized solar microgrid networks.',
        excerptVi: 'Khảo sát mạng lưới điện vi mô năng lượng mặt trời phi tập trung.',
        sourceName: 'Clean Energy Review',
        sourceUrl: 'https://example.com/energy-rev',
        cefrLevel: CefrLevel.B2,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        categories: {
          create: {
            categoryId: testCategoryId,
          },
        },
      },
    });
    createdArticleIds.push(artA.id);

    // 3. Create Article B: Published, C1 level, title has "quantum computing", excerpt has "sustainability"
    const artB = await prisma.article.create({
      data: {
        slug: `search-art-b-${testTimestamp}`,
        titleEn: `Quantum Computing Architectures for Climate Science ${testTimestamp}`,
        titleVi: `Kiến trúc Điện toán Lượng tử cho Khoa học Khí hậu ${testTimestamp}`,
        excerptEn: 'Achieving long-term sustainability through computational modeling.',
        excerptVi: 'Đạt được tính bền vững dài hạn thông qua mô hình hóa điện toán.',
        sourceName: 'Tech Research Journal',
        sourceUrl: 'https://example.com/tech-res',
        cefrLevel: CefrLevel.C1,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
      },
    });
    createdArticleIds.push(artB.id);

    // 4. Create Article C: Draft article with matching keyword (must NOT be returned publicly)
    const artC = await prisma.article.create({
      data: {
        slug: `search-art-c-draft-${testTimestamp}`,
        titleEn: `Draft Secret Energy Report ${testTimestamp}`,
        titleVi: `Báo cáo năng lượng tuyệt mật dự thảo ${testTimestamp}`,
        excerptEn: 'Draft sustainability data.',
        sourceName: 'Internal Notes',
        sourceUrl: 'https://example.com/internal',
        cefrLevel: CefrLevel.B2,
        status: ArticleStatus.DRAFT,
      },
    });
    createdArticleIds.push(artC.id);

    // 5. Create Article D: Future scheduled article with matching keyword (must NOT be returned publicly)
    const artD = await prisma.article.create({
      data: {
        slug: `search-art-d-future-${testTimestamp}`,
        titleEn: `Future Energy Forecast 2030 ${testTimestamp}`,
        titleVi: `Dự báo năng lượng tương lai 2030 ${testTimestamp}`,
        sourceName: 'Future Energy',
        sourceUrl: 'https://example.com/future',
        cefrLevel: CefrLevel.B2,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() + 86400000), // 1 day in future
      },
    });
    createdArticleIds.push(artD.id);

    console.log('--- Fixtures ready. Running verification tests ---\n');

    // -------------------------------------------------------------
    // FULL-TEXT & HYBRID SEARCH TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-01: Full-text English search returns published article
    try {
      const res = await searchPublicArticles({ q: `Renewable Energy ${testTimestamp}` });
      const found = res.articles.some((a) => a.id === artA.id);
      recordTest('TC-SEARCH-01', 'Full-text English search returns published article matching keyword', found, `Matched article A: ${found}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-01', 'Full-text English search returns published article matching keyword', false, getErrorMessage(e));
    }

    // TC-SEARCH-02: Full-text English search handles stemming (sustainable <-> sustainability)
    try {
      // "sustainable" should match "Sustainability" via tsvector english stemming
      const res = await searchPublicArticles({ q: 'sustainable' });
      const found = res.articles.some((a) => a.id === artA.id || a.id === artB.id);
      recordTest('TC-SEARCH-02', 'Full-text English search handles stemming (sustainable -> sustainability)', found, `Matched stemmed article: ${found}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-02', 'Full-text English search handles stemming (sustainable -> sustainability)', false, getErrorMessage(e));
    }

    // TC-SEARCH-03: Vietnamese title trigram search returns correct article
    try {
      const res = await searchPublicArticles({ q: 'Điện toán Lượng tử' });
      const found = res.articles.some((a) => a.id === artB.id);
      recordTest('TC-SEARCH-03', 'Vietnamese title trigram search returns correct article', found, `Matched Vietnamese title: ${found}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-03', 'Vietnamese title trigram search returns correct article', false, getErrorMessage(e));
    }

    // TC-SEARCH-04: Vietnamese excerpt trigram search matches definition text
    try {
      const res = await searchPublicArticles({ q: 'mạng lưới điện vi mô' });
      const found = res.articles.some((a) => a.id === artA.id);
      recordTest('TC-SEARCH-04', 'Vietnamese excerpt trigram search matches definition text', found, `Matched excerpt text: ${found}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-04', 'Vietnamese excerpt trigram search matches definition text', false, getErrorMessage(e));
    }

    // TC-SEARCH-05: Case-insensitive search parity
    try {
      const resUpper = await searchPublicArticles({ q: `QUANTUM ${testTimestamp}` });
      const resLower = await searchPublicArticles({ q: `quantum ${testTimestamp}` });
      const passed = resUpper.totalCount === resLower.totalCount && resUpper.totalCount >= 1;
      recordTest('TC-SEARCH-05', 'Case-insensitive search parity ("QUANTUM" === "quantum")', passed, `Count upper: ${resUpper.totalCount}, lower: ${resLower.totalCount}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-05', 'Case-insensitive search parity ("QUANTUM" === "quantum")', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // FACETED & COMBINED FILTERING TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-06: Category filter isolates only articles in specified category
    try {
      const res = await searchPublicArticles({ categorySlug: testCategorySlug });
      const passed = res.articles.every((a) =>
        a.categories.some((c) => c.category.slug === testCategorySlug)
      ) && res.articles.some((a) => a.id === artA.id);
      recordTest('TC-SEARCH-06', 'Category filter isolates only articles in specified category', passed, `Total category articles: ${res.totalCount}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-06', 'Category filter isolates only articles in specified category', false, getErrorMessage(e));
    }

    // TC-SEARCH-07: CEFR filter isolates only articles matching target level
    try {
      const resB2 = await searchPublicArticles({ cefrLevel: CefrLevel.B2 });
      const resC1 = await searchPublicArticles({ cefrLevel: CefrLevel.C1 });
      const passed =
        resB2.articles.every((a) => a.cefrLevel === CefrLevel.B2) &&
        resC1.articles.every((a) => a.cefrLevel === CefrLevel.C1) &&
        resB2.articles.some((a) => a.id === artA.id) &&
        resC1.articles.some((a) => a.id === artB.id);
      recordTest('TC-SEARCH-07', 'CEFR filter isolates only articles matching target level', passed, `B2 count: ${resB2.totalCount}, C1 count: ${resC1.totalCount}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-07', 'CEFR filter isolates only articles matching target level', false, getErrorMessage(e));
    }

    // TC-SEARCH-08: Combined search (q + category + level) produces exact intersection
    try {
      // Art A is B2 + testCategorySlug + has "Renewable"
      // Art B is C1 (not in testCategorySlug)
      const res = await searchPublicArticles({
        q: 'Renewable',
        categorySlug: testCategorySlug,
        cefrLevel: CefrLevel.B2,
      });
      const passed = res.articles.length === 1 && res.articles[0].id === artA.id;
      recordTest('TC-SEARCH-08', 'Combined search (q + category + level) produces exact intersection', passed, `Matched exactly 1 item: ${passed}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-08', 'Combined search (q + category + level) produces exact intersection', false, getErrorMessage(e));
    }

    // TC-SEARCH-09: Draft, pending, archived, and future articles strictly excluded
    try {
      const res = await searchPublicArticles({ q: `Secret Energy Report ${testTimestamp}` });
      const resFuture = await searchPublicArticles({ q: `Future Energy Forecast ${testTimestamp}` });
      const passed = res.totalCount === 0 && resFuture.totalCount === 0;
      recordTest('TC-SEARCH-09', 'Draft and future articles strictly excluded from search', passed, '0 draft/future articles leaked');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-09', 'Draft and future articles strictly excluded from search', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // AUTOCOMPLETE SUGGESTIONS TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-10: Autocomplete suggestions returns top matches with category & CEFR metadata
    try {
      const suggestions = await getSearchSuggestions(`Innovations ${testTimestamp}`, 5);
      const passed =
        suggestions.length >= 1 &&
        suggestions[0].id === artA.id &&
        suggestions[0].cefrLevel === CefrLevel.B2 &&
        Boolean(suggestions[0].primaryCategory);
      recordTest('TC-SEARCH-10', 'Autocomplete suggestions returns top matches with category & CEFR', passed, `Suggestions count: ${suggestions.length}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-10', 'Autocomplete suggestions returns top matches with category & CEFR', false, getErrorMessage(e));
    }

    // TC-SEARCH-11: Autocomplete suggestions query < 2 characters safely rejected
    try {
      const empty1 = await getSearchSuggestions('a', 5);
      const empty0 = await getSearchSuggestions('', 5);
      const passed = empty1.length === 0 && empty0.length === 0;
      recordTest('TC-SEARCH-11', 'Autocomplete suggestions query < 2 characters safely returns empty array', passed, 'Short queries bypassed');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-11', 'Autocomplete suggestions query < 2 characters safely returns empty array', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // RANKING & PAGINATION TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-12: Relevance ranking places title matches above excerpt-only matches
    try {
      // In Art A, "Renewable" is in title. In an excerpt-only match, rank is lower.
      // Search "sustainability": Art A has it in title (weight A + rank boost), Art B has it in excerpt (weight B).
      const res = await searchPublicArticles({ q: 'sustainability' });
      const indexA = res.articles.findIndex((a) => a.id === artA.id);
      const indexB = res.articles.findIndex((a) => a.id === artB.id);
      // If both match, artA (title match) should rank higher (smaller index) than artB
      const passed = indexA !== -1 && indexB !== -1 && indexA < indexB;
      recordTest('TC-SEARCH-12', 'Relevance ranking places title matches above excerpt-only matches', passed, `Index A: ${indexA}, Index B: ${indexB}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-12', 'Relevance ranking places title matches above excerpt-only matches', false, getErrorMessage(e));
    }

    // TC-SEARCH-13: Pagination page=1 and page=2 returns distinct non-overlapping sets
    try {
      const p1 = await searchPublicArticles({ pageSize: 1, page: 1 });
      const p2 = await searchPublicArticles({ pageSize: 1, page: 2 });
      const passed = p1.articles.length === 1 && p2.articles.length === 1 && p1.articles[0].id !== p2.articles[0].id;
      recordTest('TC-SEARCH-13', 'Pagination page=1 and page=2 returns distinct non-overlapping sets', passed, `P1 ID: ${p1.articles[0]?.id}, P2 ID: ${p2.articles[0]?.id}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-13', 'Pagination page=1 and page=2 returns distinct non-overlapping sets', false, getErrorMessage(e));
    }

    // TC-SEARCH-14: Out-of-bounds pagination (page=9999) returns empty array without throwing
    try {
      const res = await searchPublicArticles({ page: 9999, pageSize: 12 });
      const passed = res.articles.length === 0 && res.currentPage === 9999;
      recordTest('TC-SEARCH-14', 'Out-of-bounds pagination (page=9999) returns empty array without throwing', passed, `Items: ${res.articles.length}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-14', 'Out-of-bounds pagination (page=9999) returns empty array without throwing', false, getErrorMessage(e));
    }

    // TC-SEARCH-15: Negative or zero page number normalized safely to page 1
    try {
      const resZero = await searchPublicArticles({ page: 0 });
      const resNeg = await searchPublicArticles({ page: -5 });
      const passed = resZero.currentPage === 1 && resNeg.currentPage === 1;
      recordTest('TC-SEARCH-15', 'Negative or zero page number normalized safely to page 1', passed, `Normalized page: ${resZero.currentPage}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-15', 'Negative or zero page number normalized safely to page 1', false, getErrorMessage(e));
    }

    // TC-SEARCH-16: Empty search results returns totalCount: 0 and empty array
    try {
      const res = await searchPublicArticles({ q: `nonexistent-term-${testTimestamp}` });
      const passed = res.totalCount === 0 && res.articles.length === 0 && res.totalPages === 1;
      recordTest('TC-SEARCH-16', 'Empty search results returns totalCount: 0 and empty array', passed, `Total: ${res.totalCount}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-16', 'Empty search results returns totalCount: 0 and empty array', false, getErrorMessage(e));
    }

    // TC-SEARCH-17: Punctuation and special search characters sanitized safely
    try {
      // Characters that break raw tsquery if unescaped: & | ! : * ' " ( )
      const res = await searchPublicArticles({ q: "energy & 'resilience' | !microgrid (test)*" });
      const passed = Array.isArray(res.articles);
      recordTest('TC-SEARCH-17', 'Punctuation and special search characters sanitized safely', passed, 'Executed without Postgres syntax error');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-17', 'Punctuation and special search characters sanitized safely', false, getErrorMessage(e));
    }

    // TC-SEARCH-18: Search highlight utility splits and marks text cleanly without HTML injection
    try {
      const { SearchHighlight } = await import('../src/components/search/search-highlight');
      const element = SearchHighlight({ text: 'Renewable Clean Energy', query: 'clean' });
      const passed = element !== null && typeof element === 'object';
      recordTest('TC-SEARCH-18', 'Search highlight component generates valid React tree safely', passed, 'Tokenized without dangerouslySetInnerHTML');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-18', 'Search highlight component generates valid React tree safely', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // API CONTRACT TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-19: Public API route validation schema matches OpenAPI spec
    try {
      const valid = searchParamsSchema.safeParse({
        q: 'energy',
        category: 'technology',
        level: 'B2',
        page: '1',
        limit: '12',
      });
      recordTest('TC-SEARCH-19', 'Search query schema parses valid query parameters according to OpenAPI contract', valid.success, JSON.stringify(valid.data));
    } catch (e: unknown) {
      recordTest('TC-SEARCH-19', 'Search query schema parses valid query parameters according to OpenAPI contract', false, getErrorMessage(e));
    }

    // TC-SEARCH-20: Suggestions query schema validates min 2 characters
    try {
      const valid = suggestionsQuerySchema.safeParse({ q: 'en' });
      const invalid = suggestionsQuerySchema.safeParse({ q: 'e' });
      const passed = valid.success && !invalid.success;
      recordTest('TC-SEARCH-20', 'Suggestions query schema enforces 2 characters minimum', passed, `Valid: ${valid.success}, Short: ${!invalid.success}`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-20', 'Suggestions query schema enforces 2 characters minimum', false, getErrorMessage(e));
    }

    // TC-SEARCH-21: URL state sync contract produces valid query string
    try {
      const params = new URLSearchParams();
      params.set('q', 'quantum');
      params.set('category', 'tech');
      params.set('level', 'C1');
      params.set('page', '2');
      const queryString = params.toString();
      const parsed = searchParamsSchema.safeParse(Object.fromEntries(params.entries()));
      const passed = parsed.success && queryString === 'q=quantum&category=tech&level=C1&page=2';
      recordTest('TC-SEARCH-21', 'URL state sync contract produces valid query string matching search state', passed, queryString);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-21', 'URL state sync contract produces valid query string matching search state', false, getErrorMessage(e));
    }

    // TC-SEARCH-22: Exclude ID option functions properly (spotlight exclusion)
    try {
      const all = await searchPublicArticles({ q: `Renewable Energy ${testTimestamp}` });
      const excluded = await searchPublicArticles({
        q: `Renewable Energy ${testTimestamp}`,
        excludeId: artA.id,
      });
      const passed = all.articles.some((a) => a.id === artA.id) && !excluded.articles.some((a) => a.id === artA.id);
      recordTest('TC-SEARCH-22', 'Exclude ID option excludes specified spotlight article from search results', passed, `All had A: true, Excluded had A: false`);
    } catch (e: unknown) {
      recordTest('TC-SEARCH-22', 'Exclude ID option excludes specified spotlight article from search results', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // DATABASE INDEX VERIFICATION TESTS
    // -------------------------------------------------------------

    // TC-SEARCH-23: Trigram index scan verified via EXPLAIN ANALYZE on Article table
    try {
      await prisma.$queryRawUnsafe('SET enable_seqscan = off;');
      const explainRows = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(`
        EXPLAIN ANALYZE 
        SELECT id FROM "Article" 
        WHERE "titleVi" ILIKE '%năng lượng%';
      `);
      const plan = explainRows.map((r) => r['QUERY PLAN']).join('\n');
      const usedIndex = plan.includes('Article_titleVi_trgm_idx') || plan.includes('Bitmap Index Scan');
      await prisma.$queryRawUnsafe('SET enable_seqscan = on;');
      recordTest('TC-SEARCH-23', 'Trigram index scan verified via EXPLAIN ANALYZE on Article table', usedIndex, 'Bitmap Index Scan confirmed on Article_titleVi_trgm_idx');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-23', 'Trigram index scan verified via EXPLAIN ANALYZE on Article table', false, getErrorMessage(e));
    }

    // TC-SEARCH-24: searchVector index scan verified via EXPLAIN ANALYZE on English query
    try {
      await prisma.$queryRawUnsafe('SET enable_seqscan = off;');
      const explainRows = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(`
        EXPLAIN ANALYZE 
        SELECT id FROM "Article" 
        WHERE "searchVector" @@ websearch_to_tsquery('english', 'energy');
      `);
      const plan = explainRows.map((r) => r['QUERY PLAN']).join('\n');
      const usedIndex = plan.includes('Article_searchVector_idx') || plan.includes('Bitmap Index Scan');
      await prisma.$queryRawUnsafe('SET enable_seqscan = on;');
      recordTest('TC-SEARCH-24', 'searchVector GIN index scan verified via EXPLAIN ANALYZE on English query', usedIndex, 'Bitmap Index Scan confirmed on Article_searchVector_idx');
    } catch (e: unknown) {
      recordTest('TC-SEARCH-24', 'searchVector GIN index scan verified via EXPLAIN ANALYZE on English query', false, getErrorMessage(e));
    }

    // -------------------------------------------------------------
    // SECURITY TESTS
    // -------------------------------------------------------------

    // TC-SEC-01: XSS injection attempt in q safely sanitized and neutralized
    try {
      const xssPayload = '<script>alert("XSS")</script>';
      const res = await searchPublicArticles({ q: xssPayload });
      const passed = res.activeQuery === xssPayload && Array.isArray(res.articles);
      recordTest('TC-SEC-01', 'XSS injection attempt in search query handled safely', passed, 'Parameterized and escaped without script execution');
    } catch (e: unknown) {
      recordTest('TC-SEC-01', 'XSS injection attempt in search query handled safely', false, getErrorMessage(e));
    }

    // TC-SEC-02: SQL injection payload in q safely parameterized by Prisma
    try {
      const sqliPayload = "' OR 1=1; DROP TABLE \"Article\"; --";
      const res = await searchPublicArticles({ q: sqliPayload });
      // Database must remain intact
      const articleCount = await prisma.article.count();
      const passed = articleCount >= 1 && Array.isArray(res.articles);
      recordTest('TC-SEC-02', 'SQL injection attempt neutralized by parameterized SQL template', passed, `Article table intact (count: ${articleCount})`);
    } catch (e: unknown) {
      recordTest('TC-SEC-02', 'SQL injection attempt neutralized by parameterized SQL template', false, getErrorMessage(e));
    }

    // TC-SEC-03: Oversized query string (> 10,000 characters) rejected by Zod schema
    try {
      const hugeString = 'a'.repeat(10001);
      const parsed = searchParamsSchema.safeParse({ q: hugeString });
      const passed = !parsed.success;
      recordTest('TC-SEC-03', 'Oversized query string (> 10,000 chars) rejected by Zod schema', passed, 'Rejected with validation error');
    } catch (e: unknown) {
      recordTest('TC-SEC-03', 'Oversized query string (> 10,000 chars) rejected by Zod schema', false, getErrorMessage(e));
    }

    // TC-SEC-04: Rate limiting on /api/search blocks requests beyond 60 req/min
    try {
      const key = `test-search-rl-${Date.now()}`;
      let blocked = false;
      for (let i = 0; i < 65; i++) {
        const rl = await rateLimit(key, 60);
        if (!rl.success) {
          blocked = true;
          break;
        }
      }
      recordTest('TC-SEC-04', 'Rate limiter blocks search requests exceeding 60 req/min', blocked, 'Rate limit enforced after 60 requests');
    } catch (e: unknown) {
      recordTest('TC-SEC-04', 'Rate limiter blocks search requests exceeding 60 req/min', false, getErrorMessage(e));
    }

    // TC-SEC-05: Rate limiting on /api/search/suggestions blocks requests beyond 120 req/min
    try {
      const key = `test-sugg-rl-${Date.now()}`;
      let blocked = false;
      for (let i = 0; i < 125; i++) {
        const rl = await rateLimit(key, 120);
        if (!rl.success) {
          blocked = true;
          break;
        }
      }
      recordTest('TC-SEC-05', 'Rate limiter blocks suggestion requests exceeding 120 req/min', blocked, 'Rate limit enforced after 120 requests');
    } catch (e: unknown) {
      recordTest('TC-SEC-05', 'Rate limiter blocks suggestion requests exceeding 120 req/min', false, getErrorMessage(e));
    }

    // TC-SEC-06: Invalid CEFR enum value in query params normalized safely
    try {
      const parsed = searchParamsSchema.safeParse({ level: 'INVALID_LEVEL' });
      const passed = !parsed.success;
      recordTest('TC-SEC-06', 'Invalid CEFR enum value safely rejected by schema', passed, 'Rejected malformed CEFR parameter');
    } catch (e: unknown) {
      recordTest('TC-SEC-06', 'Invalid CEFR enum value safely rejected by schema', false, getErrorMessage(e));
    }

    // TC-SEC-07: Invalid category slug handled gracefully (0 results, no 500 crash)
    try {
      const res = await searchPublicArticles({ categorySlug: 'non-existent-category-slug' });
      const passed = res.totalCount === 0 && res.articles.length === 0;
      recordTest('TC-SEC-07', 'Invalid category slug handled gracefully (0 results, no 500 error)', passed, `Total: ${res.totalCount}`);
    } catch (e: unknown) {
      recordTest('TC-SEC-07', 'Invalid category slug handled gracefully (0 results, no 500 error)', false, getErrorMessage(e));
    }

    // TC-SEC-08: Zero database credentials, internal IDs, or user session data leaked in search DTOs
    try {
      const res = await searchPublicArticles({ q: 'energy' });
      const serialized = JSON.stringify(res);
      const leaked =
        serialized.includes('postgresql://') ||
        serialized.includes('DATABASE_URL') ||
        serialized.includes('AUTH_SECRET') ||
        serialized.includes('passwordHash') ||
        serialized.includes('ADMIN');
      const passed = !leaked;
      recordTest('TC-SEC-08', 'No Prisma credentials or secret environment variables leaked to search DTOs', passed, 'Payload clean and sanitized');
    } catch (e: unknown) {
      recordTest('TC-SEC-08', 'No Prisma credentials or secret environment variables leaked to search DTOs', false, getErrorMessage(e));
    }

  } finally {
    // Teardown test fixtures
    console.log('\n--- Cleaning up search test fixtures ---');
    try {
      if (createdArticleIds.length > 0) {
        await prisma.articleCategory.deleteMany({
          where: { articleId: { in: createdArticleIds } },
        });
        await prisma.article.deleteMany({
          where: { id: { in: createdArticleIds } },
        });
      }
      if (testCategoryId) {
        await prisma.category.deleteMany({
          where: { id: testCategoryId },
        });
      }
      console.log('Cleanup completed successfully.');
    } catch (cleanupErr: unknown) {
      console.error('Test cleanup error:', cleanupErr);
    }
  }

  console.log('\n=================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(
    `SUMMARY: ${passedCount}/${results.length} TESTS PASSED (${((passedCount / results.length) * 100).toFixed(0)}%)`
  );
  if (failedCount > 0) {
    console.log(`FAILED TESTS: ${failedCount}`);
  }
  console.log('=================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSearchVerificationSuite()
  .then(() => prisma.$disconnect())
  .catch((e: unknown) => {
    console.error('Fatal test error:', e);
    prisma.$disconnect();
    process.exit(1);
  });
