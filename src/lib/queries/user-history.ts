import { Prisma, CefrLevel } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HistoryQueryInput } from '@/validations/user-history';

export interface HistoryArticleSummary {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  thumbnailUrl: string | null;
  cefrLevel: CefrLevel;
  readingTimeMinutes: number;
  sourceName: string;
  categories: Array<{
    category: {
      id: string;
      slug: string;
      nameVi: string;
      nameEn: string;
    };
  }>;
}

export interface ReadingHistoryItem {
  id: string;
  userId: string;
  articleId: string;
  readPercentage: number;
  completed: boolean;
  lastReadAt: Date;
  article: HistoryArticleSummary;
}

export interface PaginatedHistoryResult {
  items: ReadingHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FavoriteArticleItem {
  id: string;
  userId: string;
  articleId: string;
  createdAt: Date;
  article: HistoryArticleSummary;
}

export interface PaginatedFavoritesResult {
  items: FavoriteArticleItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Retrieves paginated reading history for a user with category and CEFR level filtering.
 * Guaranteed zero N+1 queries.
 */
export async function getUserReadingHistory(
  userId: string,
  params: HistoryQueryInput
): Promise<PaginatedHistoryResult> {
  const { page = 1, limit = 10, category, level } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.ReadingHistoryWhereInput = {
    userId,
    article: {
      ...(level ? { cefrLevel: level } : {}),
      ...(category
        ? {
            categories: {
              some: {
                category: { slug: category },
              },
            },
          }
        : {}),
    },
  };

  const [total, records] = await Promise.all([
    prisma.readingHistory.count({ where }),
    prisma.readingHistory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { lastReadAt: 'desc' },
      include: {
        article: {
          select: {
            id: true,
            slug: true,
            titleEn: true,
            titleVi: true,
            thumbnailUrl: true,
            cefrLevel: true,
            readingTimeMinutes: true,
            sourceName: true,
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
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: records as ReadingHistoryItem[],
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Retrieves paginated favorites for a user with category and CEFR level filtering.
 * Guaranteed zero N+1 queries.
 */
export async function getUserFavorites(
  userId: string,
  params: HistoryQueryInput
): Promise<PaginatedFavoritesResult> {
  const { page = 1, limit = 10, category, level } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.FavoriteWhereInput = {
    userId,
    article: {
      ...(level ? { cefrLevel: level } : {}),
      ...(category
        ? {
            categories: {
              some: {
                category: { slug: category },
              },
            },
          }
        : {}),
    },
  };

  const [total, records] = await Promise.all([
    prisma.favorite.count({ where }),
    prisma.favorite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        article: {
          select: {
            id: true,
            slug: true,
            titleEn: true,
            titleVi: true,
            thumbnailUrl: true,
            cefrLevel: true,
            readingTimeMinutes: true,
            sourceName: true,
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
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items: records as FavoriteArticleItem[],
    total,
    page,
    limit,
    totalPages,
  };
}
