import { CefrLevel, Prisma, Vocabulary } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface WordBankContext {
  sentence: {
    textEn: string;
    textVi: string;
    orderIndex: number;
    article: {
      slug: string;
      titleEn: string;
    };
  };
}

export interface WordBankItem {
  id: string;
  userId: string;
  vocabularyId: string;
  notes: string | null;
  isMastered: boolean;
  savedAt: Date;
  vocabulary: Vocabulary;
  context: WordBankContext | null;
}

export interface WordBankPageResult {
  items: WordBankItem[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface GetWordBankParams {
  userId: string;
  q?: string;
  cefr?: CefrLevel | 'ALL';
  page: number;
  limit?: number;
}

/**
 * Retrieves a paginated list of saved vocabulary items for an authenticated user.
 * Implements batch-fetching for article sentence contexts to strictly prevent N+1 queries.
 * Total database queries per request: exactly 3 (count, items, contexts).
 */
export async function getWordBankPage(params: GetWordBankParams): Promise<WordBankPageResult> {
  const { userId, q, cefr, limit = 12 } = params;

  // Build Prisma where clause
  const where: Prisma.UserSavedVocabularyWhereInput = {
    userId,
    ...(cefr && cefr !== 'ALL' ? { vocabulary: { cefrLevel: cefr } } : {}),
    ...(q
      ? {
          vocabulary: {
            ...(cefr && cefr !== 'ALL' ? { cefrLevel: cefr } : {}),
            OR: [
              { word: { contains: q, mode: 'insensitive' } },
              { meaningVi: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  // 1 & 2: Count and fetch saved records in parallel
  const [total, rawSavedItems] = await Promise.all([
    prisma.userSavedVocabulary.count({ where }),
    prisma.userSavedVocabulary.findMany({
      where,
      include: {
        vocabulary: true,
      },
      orderBy: { savedAt: 'desc' },
      skip: Math.max(0, (params.page - 1) * limit),
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);
  const validatedPage = totalPages > 0 ? Math.min(Math.max(1, params.page), totalPages) : 1;

  // 3: Batch fetch context sentences for all vocabulary items on this page (1 single query)
  const vocabIds = rawSavedItems.map((item) => item.vocabularyId);
  const contexts = vocabIds.length > 0
    ? await prisma.sentenceVocabulary.findMany({
        where: {
          vocabularyId: { in: vocabIds },
        },
        include: {
          sentence: {
            select: {
              textEn: true,
              textVi: true,
              orderIndex: true,
              article: {
                select: {
                  slug: true,
                  titleEn: true,
                },
              },
            },
          },
        },
        orderBy: {
          sentence: {
            orderIndex: 'asc',
          },
        },
      })
    : [];

  // Group by vocabularyId, preserving the earliest sentence context (lowest orderIndex)
  const contextByVocabId = new Map<string, WordBankContext>();
  for (const c of contexts) {
    if (!contextByVocabId.has(c.vocabularyId) && c.sentence?.article) {
      contextByVocabId.set(c.vocabularyId, {
        sentence: {
          textEn: c.sentence.textEn,
          textVi: c.sentence.textVi,
          orderIndex: c.sentence.orderIndex,
          article: {
            slug: c.sentence.article.slug,
            titleEn: c.sentence.article.titleEn,
          },
        },
      });
    }
  }

  // Combine items with their context
  const items: WordBankItem[] = rawSavedItems.map((item) => ({
    id: item.id,
    userId: item.userId,
    vocabularyId: item.vocabularyId,
    notes: item.notes,
    isMastered: item.isMastered,
    savedAt: item.savedAt,
    vocabulary: item.vocabulary,
    context: contextByVocabId.get(item.vocabularyId) || null,
  }));

  return {
    items,
    total,
    totalPages,
    page: validatedPage,
    limit,
  };
}
