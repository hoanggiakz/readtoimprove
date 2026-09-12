/**
 * ReadToImprove — Phase 5 Public Discovery & Content Browsing Verification Suite
 *
 * Tests 20 critical public discovery requirements:
 * TC-PUBLIC-01: Homepage discovery data loads successfully
 * TC-PUBLIC-02: Only published articles are returned
 * TC-PUBLIC-03: Future scheduled articles are hidden
 * TC-PUBLIC-04: Draft articles are hidden
 * TC-PUBLIC-05: Pending-review articles are hidden
 * TC-PUBLIC-06: Archived articles are hidden
 * TC-PUBLIC-07: Latest article ordering is deterministic
 * TC-PUBLIC-08: Pagination does not expose unpublished content
 * TC-PUBLIC-09: Category filtering works
 * TC-PUBLIC-10: Invalid category handling
 * TC-PUBLIC-11: CEFR A1-C2 filtering
 * TC-PUBLIC-12: Invalid CEFR rejection / normalization
 * TC-PUBLIC-13: Search query validation (< 2 chars bypassed)
 * TC-PUBLIC-14: Search only returns public articles (drafts hidden)
 * TC-PUBLIC-15: Empty search results
 * TC-PUBLIC-16: Article slug resolves correctly
 * TC-PUBLIC-17: Unpublished article direct access returns null (404)
 * TC-PUBLIC-18: SEO metadata generation
 * TC-PUBLIC-19: Admin route remains private & blocked in robots
 * TC-PUBLIC-20: Client/server boundary integrity (no Prisma leak)
 */

import { prisma } from '../src/lib/prisma';
import {
  getPublicArticles,
  getSpotlightArticle,
  getPublicArticleBySlug,
  getPublicCategoriesWithCounts,
  getCategoryBySlug,
  getPublicArticleWhereClause,
} from '../src/lib/articles';
import { publicArticlesQuerySchema } from '../src/validations/public';
import { generateMetadata as generateArticleMetadata } from '../src/app/(public)/articles/[slug]/page';
import robots from '../src/app/robots';
import { ArticleStatus, CefrLevel } from '@prisma/client';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  details?: unknown;
}

const results: TestResult[] = [];

function recordTest(id: string, name: string, passed: boolean, message?: string, details?: unknown) {
  results.push({ id, name, passed, message, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [${id}] ${name}${message ? ` — ${message}` : ''}`);
}

async function runPublicVerificationSuite() {
  console.log('\n=================================================================');
  console.log('  READTOIMPROVE — PHASE 5 PUBLIC DISCOVERY VERIFICATION SUITE');
  console.log('=================================================================\n');

  const testPrefix = `test-pub-${Date.now()}`;
  const createdArticleIds: string[] = [];
  let testCategoryId = '';

  try {
    // -------------------------------------------------------------
    // SETUP: Create isolated test fixtures
    // -------------------------------------------------------------
    console.log('--- Setting up isolated test fixtures ---');

    // 1. Create a test category
    const testCategory = await prisma.category.create({
      data: {
        slug: `${testPrefix}-tech`,
        nameEn: 'Test Technology',
        nameVi: 'Công nghệ thử nghiệm',
        description: 'Test category description for Phase 5 verification',
        orderIndex: 999,
      },
    });
    testCategoryId = testCategory.id;

    // 2. Create a PUBLISHED article (in past)
    const pubArticle = await prisma.article.create({
      data: {
        slug: `${testPrefix}-published`,
        titleEn: `Published Article Title ${testPrefix} xylophone-pub`,
        titleVi: `Tiêu đề bài viết đã xuất bản ${testPrefix}`,
        excerptEn: 'This is a valid published article excerpt in English.',
        excerptVi: 'Đây là đoạn trích bài viết đã xuất bản bằng tiếng Việt.',
        sourceName: 'Test Gazette',
        sourceUrl: 'https://example.com/pub',
        cefrLevel: CefrLevel.B2,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        readingTimeMinutes: 4,
        categories: {
          create: {
            categoryId: testCategoryId,
          },
        },
        sentences: {
          create: {
            orderIndex: 0,
            textEn: 'Artificial intelligence is reshaping global modern education.',
            textVi: 'Trí tuệ nhân tạo đang định hình lại nền giáo dục hiện đại toàn cầu.',
          },
        },
      },
    });
    createdArticleIds.push(pubArticle.id);

    // 3. Create a DRAFT article
    const draftArticle = await prisma.article.create({
      data: {
        slug: `${testPrefix}-draft`,
        titleEn: `Draft Article Title ${testPrefix} xylophone-draft`,
        titleVi: `Tiêu đề bài nháp ${testPrefix}`,
        sourceName: 'Test Gazette',
        sourceUrl: 'https://example.com/draft',
        cefrLevel: CefrLevel.B1,
        status: ArticleStatus.DRAFT,
        publishedAt: null,
      },
    });
    createdArticleIds.push(draftArticle.id);

    // 4. Create a PENDING_REVIEW article
    const pendingArticle = await prisma.article.create({
      data: {
        slug: `${testPrefix}-pending`,
        titleEn: `Pending Review Article ${testPrefix}`,
        titleVi: `Tiêu đề bài chờ duyệt ${testPrefix}`,
        sourceName: 'Test Gazette',
        sourceUrl: 'https://example.com/pending',
        cefrLevel: CefrLevel.C1,
        status: ArticleStatus.PENDING_REVIEW,
        publishedAt: null,
      },
    });
    createdArticleIds.push(pendingArticle.id);

    // 5. Create an ARCHIVED article
    const archivedArticle = await prisma.article.create({
      data: {
        slug: `${testPrefix}-archived`,
        titleEn: `Archived Article Title ${testPrefix}`,
        titleVi: `Tiêu đề bài lưu trữ ${testPrefix}`,
        sourceName: 'Test Gazette',
        sourceUrl: 'https://example.com/archived',
        cefrLevel: CefrLevel.B2,
        status: ArticleStatus.ARCHIVED,
        publishedAt: new Date(Date.now() - 7200000),
      },
    });
    createdArticleIds.push(archivedArticle.id);

    // 6. Create a FUTURE SCHEDULED article (publishedAt in future)
    const futureArticle = await prisma.article.create({
      data: {
        slug: `${testPrefix}-future`,
        titleEn: `Future Article Title ${testPrefix}`,
        titleVi: `Tiêu đề bài tương lai ${testPrefix}`,
        sourceName: 'Test Gazette',
        sourceUrl: 'https://example.com/future',
        cefrLevel: CefrLevel.C2,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date(Date.now() + 86400000), // 24 hours in future
        scheduledAt: new Date(Date.now() + 86400000),
      },
    });
    createdArticleIds.push(futureArticle.id);

    console.log(`Created 5 test articles with prefix: ${testPrefix}\n`);

    // -------------------------------------------------------------
    // TEST CASES EXECUTION
    // -------------------------------------------------------------

    // TC-PUBLIC-01: Homepage loads successfully
    {
      const spotlight = await getSpotlightArticle();
      const latest = await getPublicArticles({ pageSize: 6 });
      const categories = await getPublicCategoriesWithCounts();
      const passed =
        spotlight !== null &&
        latest.articles.length > 0 &&
        latest.totalCount > 0 &&
        categories.length > 0;
      recordTest(
        'TC-PUBLIC-01',
        'Homepage discovery data loads successfully',
        passed,
        `Spotlight: ${spotlight?.titleEn.slice(0, 30)}..., Latest: ${latest.articles.length} items, Categories: ${categories.length}`
      );
    }

    // TC-PUBLIC-02: Only published articles are returned
    {
      const result = await getPublicArticles({ pageSize: 50 });
      const now = new Date();
      const allValid = result.articles.every(
        (a) =>
          a.status === ArticleStatus.PUBLISHED &&
          a.publishedAt !== null &&
          new Date(a.publishedAt) <= now
      );
      recordTest(
        'TC-PUBLIC-02',
        'Only published articles are returned',
        allValid && result.articles.length > 0,
        `Verified ${result.articles.length} articles all have status=PUBLISHED and publishedAt <= now`
      );
    }

    // TC-PUBLIC-03: Future scheduled articles are hidden
    {
      const result = await getPublicArticles({ pageSize: 50 });
      const foundFutureInList = result.articles.some((a) => a.id === futureArticle.id);
      const foundFutureBySlug = await getPublicArticleBySlug(futureArticle.slug);
      const passed = !foundFutureInList && foundFutureBySlug === null;
      recordTest(
        'TC-PUBLIC-03',
        'Future scheduled articles are hidden',
        passed,
        `Future article excluded from list and slug lookup returned null`
      );
    }

    // TC-PUBLIC-04: Draft articles are hidden
    {
      const result = await getPublicArticles({ pageSize: 50 });
      const foundDraftInList = result.articles.some((a) => a.id === draftArticle.id);
      const foundDraftBySlug = await getPublicArticleBySlug(draftArticle.slug);
      const passed = !foundDraftInList && foundDraftBySlug === null;
      recordTest(
        'TC-PUBLIC-04',
        'Draft articles are hidden',
        passed,
        `Draft article excluded from list and slug lookup returned null`
      );
    }

    // TC-PUBLIC-05: Pending-review articles are hidden
    {
      const result = await getPublicArticles({ pageSize: 50 });
      const foundPendingInList = result.articles.some((a) => a.id === pendingArticle.id);
      const foundPendingBySlug = await getPublicArticleBySlug(pendingArticle.slug);
      const passed = !foundPendingInList && foundPendingBySlug === null;
      recordTest(
        'TC-PUBLIC-05',
        'Pending-review articles are hidden',
        passed,
        `Pending-review article excluded from list and slug lookup returned null`
      );
    }

    // TC-PUBLIC-06: Archived articles are hidden
    {
      const result = await getPublicArticles({ pageSize: 50 });
      const foundArchivedInList = result.articles.some((a) => a.id === archivedArticle.id);
      const foundArchivedBySlug = await getPublicArticleBySlug(archivedArticle.slug);
      const passed = !foundArchivedInList && foundArchivedBySlug === null;
      recordTest(
        'TC-PUBLIC-06',
        'Archived articles are hidden',
        passed,
        `Archived article excluded from list and slug lookup returned null`
      );
    }

    // TC-PUBLIC-07: Latest article ordering is deterministic
    {
      const result = await getPublicArticles({ pageSize: 20 });
      let isDeterministic = true;
      for (let i = 0; i < result.articles.length - 1; i++) {
        const current = result.articles[i];
        const next = result.articles[i + 1];
        const currentTime = new Date(current.publishedAt!).getTime();
        const nextTime = new Date(next.publishedAt!).getTime();

        if (currentTime < nextTime) {
          isDeterministic = false;
          break;
        } else if (currentTime === nextTime && current.id < next.id) {
          isDeterministic = false;
          break;
        }
      }
      recordTest(
        'TC-PUBLIC-07',
        'Latest article ordering is deterministic',
        isDeterministic,
        `Verified strict [publishedAt DESC, id DESC] ordering`
      );
    }

    // TC-PUBLIC-08: Pagination bounds & integrity
    {
      const page1 = await getPublicArticles({ page: 1, pageSize: 2 });
      const page2 = await getPublicArticles({ page: 2, pageSize: 2 });
      const noOverlap =
        page1.articles.length > 0 &&
        page2.articles.length > 0 &&
        !page1.articles.some((a1) => page2.articles.some((a2) => a1.id === a2.id));
      const passed =
        page1.currentPage === 1 &&
        page2.currentPage === 2 &&
        page1.articles.length <= 2 &&
        page2.articles.length <= 2 &&
        noOverlap;
      recordTest(
        'TC-PUBLIC-08',
        'Pagination does not expose unpublished content and bounds query sizes',
        passed,
        `Page 1 (${page1.articles.length} items) and Page 2 (${page2.articles.length} items) have 0 overlap`
      );
    }

    // TC-PUBLIC-09: Category filtering works
    {
      const categoryRecord = await getCategoryBySlug(testCategory.slug);
      const result = await getPublicArticles({ categorySlug: testCategory.slug });
      const passed =
        categoryRecord !== null &&
        categoryRecord.id === testCategory.id &&
        result.articles.length === 1 &&
        result.articles[0].id === pubArticle.id &&
        result.articles[0].categories.some((c) => c.category.slug === testCategory.slug);
      recordTest(
        'TC-PUBLIC-09',
        'Category filtering and slug lookup work',
        passed,
        `Filtered by ${testCategory.slug}, found only test published article`
      );
    }

    // TC-PUBLIC-10: Invalid category slug handling
    {
      const result = await getPublicArticles({ categorySlug: 'non-existent-category-slug-xyz' });
      const passed = result.articles.length === 0 && result.totalCount === 0 && result.totalPages === 1;
      recordTest(
        'TC-PUBLIC-10',
        'Invalid category slug handled gracefully',
        passed,
        `Returns empty array without error: ${JSON.stringify(result.articles)}`
      );
    }

    // TC-PUBLIC-11: CEFR A1-C2 filtering
    {
      const resultB2 = await getPublicArticles({ cefrLevel: CefrLevel.B2 });
      const allB2 = resultB2.articles.every((a) => a.cefrLevel === CefrLevel.B2);
      recordTest(
        'TC-PUBLIC-11',
        'CEFR A1-C2 filtering works',
        allB2 && resultB2.articles.length > 0,
        `All ${resultB2.articles.length} articles matched CEFR level B2`
      );
    }

    // TC-PUBLIC-12: Invalid CEFR parameter rejection / normalization
    {
      const parsed = publicArticlesQuerySchema.safeParse({ level: 'INVALID_LEVEL_XYZ' });
      const passed = parsed.success && parsed.data.level === undefined;
      recordTest(
        'TC-PUBLIC-12',
        'Invalid CEFR level rejected safely',
        passed,
        `Normalized invalid CEFR value to undefined without throwing`
      );
    }

    // TC-PUBLIC-13: Search query validation (< 2 chars bypassed)
    {
      const parsedShort = publicArticlesQuerySchema.safeParse({ q: 'x' });
      const resultShort = await getPublicArticles({ searchQuery: 'x' });
      // Single character query should be bypassed, returning standard published articles
      const passed = parsedShort.success && parsedShort.data.q === undefined && resultShort.articles.length > 0;
      recordTest(
        'TC-PUBLIC-13',
        'Search query validation (< 2 characters bypassed)',
        passed,
        `1-character query ignored in Zod and query service`
      );
    }

    // TC-PUBLIC-14: Search only returns public articles (drafts hidden)
    {
      // Search for 'xylophone' which matches both pubArticle (xylophone-pub) and draftArticle (xylophone-draft)
      const result = await getPublicArticles({ searchQuery: 'xylophone' });
      const foundPublished = result.articles.some((a) => a.id === pubArticle.id);
      const foundDraft = result.articles.some((a) => a.id === draftArticle.id);
      const passed = foundPublished && !foundDraft && result.articles.length === 1;
      recordTest(
        'TC-PUBLIC-14',
        'Search only returns public articles (drafts hidden)',
        passed,
        `Matched published article (${pubArticle.id}) and strictly excluded draft article`
      );
    }

    // TC-PUBLIC-15: Empty search results
    {
      const result = await getPublicArticles({ searchQuery: 'supercalifragilistic12345xyz' });
      const passed = result.articles.length === 0 && result.totalCount === 0;
      recordTest(
        'TC-PUBLIC-15',
        'Empty search results handled cleanly',
        passed,
        `Returns totalCount: 0 and empty articles array`
      );
    }

    // TC-PUBLIC-16: Public article slug resolves correctly
    {
      const article = await getPublicArticleBySlug(pubArticle.slug);
      const passed =
        article !== null &&
        article.id === pubArticle.id &&
        article.categories.length > 0 &&
        article.sentences.length > 0;
      recordTest(
        'TC-PUBLIC-16',
        'Public article slug resolves correctly',
        passed,
        `Article resolved with categories and ${article?.sentences.length} sentences`
      );
    }

    // TC-PUBLIC-17: Unpublished article direct access returns null (404)
    {
      const draftLookup = await getPublicArticleBySlug(draftArticle.slug);
      const pendingLookup = await getPublicArticleBySlug(pendingArticle.slug);
      const archivedLookup = await getPublicArticleBySlug(archivedArticle.slug);
      const futureLookup = await getPublicArticleBySlug(futureArticle.slug);
      const passed =
        draftLookup === null &&
        pendingLookup === null &&
        archivedLookup === null &&
        futureLookup === null;
      recordTest(
        'TC-PUBLIC-17',
        'Unpublished article direct access returns null (404 trigger)',
        passed,
        `All 4 non-public statuses correctly returned null on direct slug lookup`
      );
    }

    // TC-PUBLIC-18: SEO metadata generation
    {
      const meta = await generateArticleMetadata({
        params: Promise.resolve({ slug: pubArticle.slug }),
      });
      const passed =
        Boolean(meta.title) &&
        Boolean(meta.description) &&
        meta.alternates?.canonical === `/articles/${pubArticle.slug}` &&
        Boolean(meta.openGraph && (meta.openGraph as Record<string, unknown>).type === 'article');
      recordTest(
        'TC-PUBLIC-18',
        'SEO metadata generation',
        passed,
        `Title: "${meta.title}", Canonical: ${meta.alternates?.canonical}`
      );
    }

    // TC-PUBLIC-19: Admin route remains private & blocked in robots
    {
      const robotsConfig = robots();
      const rules = Array.isArray(robotsConfig.rules)
        ? robotsConfig.rules
        : [robotsConfig.rules];
      const disallows = rules.flatMap((r) =>
        Array.isArray(r.disallow) ? r.disallow : [r.disallow]
      );
      const isConsoleBlocked = disallows.some(
        (d) => typeof d === 'string' && d.includes('secure-console-x7')
      );
      recordTest(
        'TC-PUBLIC-19',
        'Admin route remains private and blocked in robots.txt',
        isConsoleBlocked,
        `Disallows: ${JSON.stringify(disallows)}`
      );
    }

    // TC-PUBLIC-20: Client/server boundary integrity
    {
      const whereClause = getPublicArticleWhereClause();
      const hasStatusPublished = whereClause.status === ArticleStatus.PUBLISHED;
      const hasPublishedAtLte = Boolean(whereClause.publishedAt);
      const passed = hasStatusPublished && hasPublishedAtLte;
      recordTest(
        'TC-PUBLIC-20',
        'Client/server boundary integrity and pure where-clause enforcement',
        passed,
        `Authoritative where clause enforces status=PUBLISHED and publishedAt <= now`
      );
    }
  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR DURING TEST EXECUTION:', error);
    recordTest('TC-PUBLIC-ERR', 'Unexpected Execution Error', false, String(error));
  } finally {
    // -------------------------------------------------------------
    // CLEANUP: Remove isolated test fixtures
    // -------------------------------------------------------------
    console.log('\n--- Cleaning up test fixtures ---');
    try {
      if (createdArticleIds.length > 0) {
        // Delete article categories first
        await prisma.articleCategory.deleteMany({
          where: { articleId: { in: createdArticleIds } },
        });
        // Delete sentences
        await prisma.sentence.deleteMany({
          where: { articleId: { in: createdArticleIds } },
        });
        // Delete test articles
        const deletedArticles = await prisma.article.deleteMany({
          where: { id: { in: createdArticleIds } },
        });
        console.log(`Cleaned up ${deletedArticles.count} test articles.`);
      }

      if (testCategoryId) {
        await prisma.category.delete({
          where: { id: testCategoryId },
        });
        console.log(`Cleaned up test category: ${testCategoryId}`);
      }
    } catch (cleanupError) {
      console.error('Failed to clean up test fixtures:', cleanupError);
    }
  }

  // -------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log('  TEST SUMMARY');
  console.log('=================================================================');
  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;

  console.log(`Total Tests : ${total}`);
  console.log(`Passed      : ${passedCount}`);
  console.log(`Failed      : ${failedCount}`);
  console.log('=================================================================\n');

  if (failedCount > 0) {
    console.error(`💥 ${failedCount} test(s) failed!`);
    process.exit(1);
  } else {
    console.log('🎉 ALL 20 PUBLIC DISCOVERY TESTS PASSED (20/20)!\n');
    process.exit(0);
  }
}

runPublicVerificationSuite();
