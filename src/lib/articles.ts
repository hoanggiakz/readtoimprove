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
 */
export async function getPublicArticles(
  options: GetPublicArticlesOptions = {}
): Promise<PaginatedArticlesResult> {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(50, Math.max(1, options.pageSize || PUBLIC_PAGE_SIZE));
  const skip = (page - 1) * pageSize;
  const now = new Date();

  const andConditions: Prisma.ArticleWhereInput[] = [];

  // Exclude specific ID if requested (e.g., hero spotlight)
  if (options.excludeId) {
    andConditions.push({ id: { not: options.excludeId } });
  }

  // Category filter
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

  // CEFR level filter
  if (options.cefrLevel) {
    andConditions.push({
      cefrLevel: options.cefrLevel,
    });
  }

  // Insensitive bilingual keyword search
  if (options.searchQuery && options.searchQuery.trim().length >= 2) {
    const query = options.searchQuery.trim();
    andConditions.push({
      OR: [
        { titleEn: { contains: query, mode: 'insensitive' } },
        { titleVi: { contains: query, mode: 'insensitive' } },
        { excerptEn: { contains: query, mode: 'insensitive' } },
        { excerptVi: { contains: query, mode: 'insensitive' } },
      ],
    });
  }

  const where = getPublicArticleWhereClause(
    andConditions.length > 0 ? { AND: andConditions } : undefined,
    now
  );

  const [articles, totalCount] = await prisma.$transaction([
    prisma.article.findMany({
      where,
      skip,
      take: pageSize,
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
    }),
    prisma.article.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    articles,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
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
