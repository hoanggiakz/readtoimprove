import { prisma } from '@/lib/prisma';
import { ArticleStatus, CefrLevel, Prisma } from '@prisma/client';
import {
  PaginatedSearchResult,
  SearchResultItem,
  SearchSuggestionItem,
} from '@/validations/search';

export const SEARCH_DEFAULT_PAGE_SIZE = 12;

export interface SearchArticlesOptions {
  q?: string;
  categorySlug?: string;
  cefrLevel?: CefrLevel;
  page?: number;
  pageSize?: number;
  excludeId?: string;
}

/**
 * Normalizes and cleans raw user search terms to prevent syntax errors
 * in PostgreSQL websearch_to_tsquery and ILIKE expressions.
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // remove control chars
    .slice(0, 100);
}

/**
 * Authoritative Server-Side Filter Rule for Public Article Visibility.
 */
export function getPublicVisibilityFilter(now = new Date()): Prisma.ArticleWhereInput {
  return {
    status: ArticleStatus.PUBLISHED,
    publishedAt: {
      not: null,
      lte: now,
    },
  };
}

/**
 * Hybrid Full-Text & Trigram Search across published articles.
 *
 * Implements:
 * - English stemming via PostgreSQL tsvector ('english' dictionary)
 * - Vietnamese accent/casing substring matching via pg_trgm GIN indexes
 * - Relevance ranking combining ts_rank_cd and exact title matches
 * - Category and CEFR multi-dimensional faceted filtering
 * - Strict public visibility security enforcement
 */
export async function searchPublicArticles(
  options: SearchArticlesOptions = {}
): Promise<PaginatedSearchResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || SEARCH_DEFAULT_PAGE_SIZE));
  const skip = (page - 1) * pageSize;
  const now = new Date();

  const rawQuery = options.q ? sanitizeSearchQuery(options.q) : '';
  const hasSearchTerm = rawQuery.length >= 2;

  // Case 1: Pure faceted filter without keyword search
  if (!hasSearchTerm) {
    const andConditions: Prisma.ArticleWhereInput[] = [getPublicVisibilityFilter(now)];

    if (options.excludeId) {
      andConditions.push({ id: { not: options.excludeId } });
    }

    if (options.categorySlug) {
      andConditions.push({
        categories: {
          some: {
            category: {
              slug: options.categorySlug,
            },
          },
        },
      });
    }

    if (options.cefrLevel) {
      andConditions.push({ cefrLevel: options.cefrLevel });
    }

    const where: Prisma.ArticleWhereInput = { AND: andConditions };

    const [articles, totalCount] = await prisma.$transaction([
      prisma.article.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
        include: {
          categories: {
            include: {
              category: {
                select: {
                  id: true,
                  slug: true,
                  nameVi: true,
                  nameEn: true,
                },
              },
            },
          },
          _count: {
            select: {
              sentences: true,
            },
          },
        },
      }),
      prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    return {
      articles: articles as unknown as SearchResultItem[],
      totalCount,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      activeQuery: undefined,
      activeCategory: options.categorySlug,
      activeCefrLevel: options.cefrLevel,
    };
  }

  // Case 2: Hybrid full-text and trigram ranked keyword search
  const wildcard = `%${rawQuery}%`;

  // Build parameterized raw SQL filter fragments
  const conditions: Prisma.Sql[] = [
    Prisma.sql`a."status" = 'PUBLISHED'`,
    Prisma.sql`a."publishedAt" IS NOT NULL`,
    Prisma.sql`a."publishedAt" <= ${now}`,
    Prisma.sql`(
      a."searchVector" @@ websearch_to_tsquery('english', ${rawQuery})
      OR a."titleVi" ILIKE ${wildcard}
      OR a."excerptVi" ILIKE ${wildcard}
      OR a."titleEn" ILIKE ${wildcard}
    )`,
  ];

  if (options.excludeId) {
    conditions.push(Prisma.sql`a."id" != ${options.excludeId}`);
  }

  if (options.cefrLevel) {
    conditions.push(Prisma.sql`a."cefrLevel" = ${options.cefrLevel}::"CefrLevel"`);
  }

  if (options.categorySlug) {
    conditions.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ArticleCategory" ac
      JOIN "Category" c ON ac."categoryId" = c."id"
      WHERE ac."articleId" = a."id" AND c."slug" = ${options.categorySlug}
    )`);
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

  // Query 1: Count total matching rows
  const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM "Article" a
    ${whereSql}
  `;
  const totalCount = Number(countResult[0]?.count || 0);

  if (totalCount === 0) {
    return {
      articles: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: page,
      hasNextPage: false,
      hasPrevPage: false,
      activeQuery: rawQuery,
      activeCategory: options.categorySlug,
      activeCefrLevel: options.cefrLevel,
    };
  }

  // Query 2: Ranked IDs for the paginated slice
  const rankedRows = await prisma.$queryRaw<Array<{ id: string; rank: number }>>`
    SELECT a."id",
      (
        ts_rank_cd(a."searchVector", websearch_to_tsquery('english', ${rawQuery})) * 2.0 +
        CASE WHEN a."titleEn" ILIKE ${wildcard} THEN 1.5 ELSE 0.0 END +
        CASE WHEN a."titleVi" ILIKE ${wildcard} THEN 1.5 ELSE 0.0 END
      )::float AS rank
    FROM "Article" a
    ${whereSql}
    ORDER BY rank DESC, a."publishedAt" DESC, a."id" DESC
    LIMIT ${pageSize} OFFSET ${skip}
  `;

  const articleIds = rankedRows.map((r) => r.id);

  // Query 3: Type-safe relational fetch for the ranked slice
  const articlesList = await prisma.article.findMany({
    where: {
      id: { in: articleIds },
    },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              slug: true,
              nameVi: true,
              nameEn: true,
            },
          },
        },
      },
      _count: {
        select: {
          sentences: true,
        },
      },
    },
  });

  // Re-sort to preserve exact ranking order from SQL query
  const articlesMap = new Map(articlesList.map((a) => [a.id, a]));
  const sortedArticles = articleIds
    .map((id) => articlesMap.get(id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    articles: sortedArticles as unknown as SearchResultItem[],
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    activeQuery: rawQuery,
    activeCategory: options.categorySlug,
    activeCefrLevel: options.cefrLevel,
  };
}

/**
 * Autocomplete Search Suggestions.
 * Returns up to 5 top-ranked suggestions for fast interactive search menus.
 */
export async function getSearchSuggestions(
  query: string,
  limit = 5
): Promise<SearchSuggestionItem[]> {
  const cleanQ = sanitizeSearchQuery(query);
  if (cleanQ.length < 2) {
    return [];
  }

  const wildcard = `%${cleanQ}%`;
  const now = new Date();

  // Query top matching published articles
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      slug: string;
      titleEn: string;
      titleVi: string;
      cefrLevel: CefrLevel;
      readingTimeMinutes: number;
    }>
  >`
    SELECT a."id", a."slug", a."titleEn", a."titleVi", a."cefrLevel", a."readingTimeMinutes"
    FROM "Article" a
    WHERE a."status" = 'PUBLISHED'
      AND a."publishedAt" IS NOT NULL
      AND a."publishedAt" <= ${now}
      AND (
        a."searchVector" @@ websearch_to_tsquery('english', ${cleanQ})
        OR a."titleVi" ILIKE ${wildcard}
        OR a."titleEn" ILIKE ${wildcard}
      )
    ORDER BY (
      ts_rank_cd(a."searchVector", websearch_to_tsquery('english', ${cleanQ})) * 2.0 +
      CASE WHEN a."titleEn" ILIKE ${wildcard} THEN 2.0 ELSE 0.0 END +
      CASE WHEN a."titleVi" ILIKE ${wildcard} THEN 2.0 ELSE 0.0 END
    ) DESC, a."publishedAt" DESC
    LIMIT ${Math.min(limit, 10)}
  `;

  if (rows.length === 0) {
    return [];
  }

  // Batch fetch primary category for the matched suggestions
  const articleIds = rows.map((r) => r.id);
  const categories = await prisma.articleCategory.findMany({
    where: { articleId: { in: articleIds } },
    include: {
      category: {
        select: {
          id: true,
          slug: true,
          nameVi: true,
          nameEn: true,
        },
      },
    },
  });

  const catMap = new Map<string, (typeof categories)[0]['category']>();
  for (const ac of categories) {
    if (!catMap.has(ac.articleId)) {
      catMap.set(ac.articleId, ac.category);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    titleEn: r.titleEn,
    titleVi: r.titleVi,
    cefrLevel: r.cefrLevel,
    readingTimeMinutes: r.readingTimeMinutes,
    primaryCategory: catMap.get(r.id) || null,
  }));
}
