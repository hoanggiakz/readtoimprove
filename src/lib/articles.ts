import { prisma } from '@/lib/prisma';
import { ArticleStatus, CefrLevel, Prisma } from '@prisma/client';

export const PUBLIC_PAGE_SIZE = 12;

export interface GetPublicArticlesOptions {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  cefrLevel?: CefrLevel;
  searchQuery?: string;
  excludeId?: string;
}

export type PublicArticleSummary = Prisma.ArticleGetPayload<{
  include: {
    categories: {
      include: {
        category: true;
      };
    };
    _count: {
      select: {
        sentences: true;
      };
    };
  };
}>;

export interface PaginatedArticlesResult {
  articles: PublicArticleSummary[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Authoritative Server-Side Filter Rule for Public Article Visibility.
 * Only articles matching:
 *   status === PUBLISHED
 *   AND publishedAt IS NOT NULL
 *   AND publishedAt <= current server time
 * may ever be returned to public consumers.
 */
export function getPublicArticleWhereClause(
  extraWhere?: Prisma.ArticleWhereInput,
  currentDate = new Date()
): Prisma.ArticleWhereInput {
  return {
    ...extraWhere,
    status: ArticleStatus.PUBLISHED,
    publishedAt: {
      not: null,
      lte: currentDate,
    },
  };
}

/**
 * Retrieve paginated public articles with optional category, CEFR, and search query filters.
 * Upgraded in Phase 8 to leverage the hybrid PostgreSQL full-text & trigram search engine.
 */
export async function getPublicArticles(
  options: GetPublicArticlesOptions = {}
): Promise<PaginatedArticlesResult> {
  const { searchPublicArticles } = await import('@/lib/search');
  const result = await searchPublicArticles({
    q: options.searchQuery,
    categorySlug: options.categorySlug,
    cefrLevel: options.cefrLevel,
    page: options.page,
    pageSize: options.pageSize,
    excludeId: options.excludeId,
  });

  return {
    articles: result.articles as unknown as PublicArticleSummary[],
    totalCount: result.totalCount,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  };
}

/**
 * Retrieve the top published article for the hero spotlight banner.
 */
export async function getSpotlightArticle(): Promise<PublicArticleSummary | null> {
  const now = new Date();
  const where = getPublicArticleWhereClause(undefined, now);

  return prisma.article.findFirst({
    where,
    orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          sentences: true,
        },
      },
    },
  });
}

/**
 * Retrieve a published article by slug.
 * Returns null if not found OR not currently published.
 */
export async function getPublicArticleBySlug(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      sentences: {
        orderBy: { orderIndex: 'asc' },
        include: {
          vocabularies: {
            include: {
              vocabulary: true,
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

  if (!article) {
    return null;
  }

  const now = new Date();
  if (
    article.status !== ArticleStatus.PUBLISHED ||
    !article.publishedAt ||
    article.publishedAt > now
  ) {
    return null;
  }

  return article;
}

/**
 * Retrieve all categories with counts of currently published articles.
 */
export async function getPublicCategoriesWithCounts() {
  const now = new Date();

  const categories = await prisma.category.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      _count: {
        select: {
          articles: {
            where: {
              article: {
                status: ArticleStatus.PUBLISHED,
                publishedAt: {
                  not: null,
                  lte: now,
                },
              },
            },
          },
        },
      },
    },
  });

  return categories;
}

/**
 * Retrieve a single category by slug.
 */
export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          articles: {
            where: {
              article: {
                status: ArticleStatus.PUBLISHED,
                publishedAt: {
                  not: null,
                  lte: new Date(),
                },
              },
            },
          },
        },
      },
    },
  });
}
