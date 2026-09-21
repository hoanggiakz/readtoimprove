'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import {
  recordProgressSchema,
  clearHistorySchema,
  syncGuestHistorySchema,
  RecordProgressInput,
  ClearHistoryInput,
  SyncGuestHistoryInput,
} from '@/validations/user-history';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Server Action: Records reading progress for an article.
 * Monotonically updates progress (percentage does not regress), marks as completed
 * when progress >= 90%, and revalidates user statistics tags.
 */
export async function recordReadingProgressAction(
  input: RecordProgressInput
): Promise<ActionResult<{ readPercentage: number; completed: boolean }>> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để lưu tiến độ đọc.',
    };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = recordProgressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { articleId, readPercentage } = parsed.data;

  // 3. Rate limit check (60 progress updates/minute/user)
  const rateLimitResult = await rateLimit(`progress:${userId}`, 60);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Thao tác quá nhanh. Tiến độ sẽ được tự động lưu sau.',
    };
  }

  // 4. Validate article existence
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, status: true },
  });
  if (!article) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Bài viết không tồn tại.',
    };
  }

  // 5. Query existing progress to ensure monotonic advancement
  const existing = await prisma.readingHistory.findUnique({
    where: {
      userId_articleId: { userId, articleId },
    },
    select: { readPercentage: true, completed: true },
  });

  const finalPercentage = existing
    ? Math.max(existing.readPercentage, readPercentage)
    : readPercentage;
  const isCompleted = finalPercentage >= 90 || Boolean(existing?.completed);

  try {
    await prisma.readingHistory.upsert({
      where: {
        userId_articleId: { userId, articleId },
      },
      create: {
        userId,
        articleId,
        readPercentage: finalPercentage,
        completed: isCompleted,
        lastReadAt: new Date(),
      },
      update: {
        readPercentage: finalPercentage,
        completed: isCompleted,
        lastReadAt: new Date(),
      },
    });

    // 6. Tag-based revalidation
    try {
      revalidateTag(`user-history-${userId}`);
      revalidateTag(`user-stats-${userId}`);
    } catch {
      // Revalidation may fail outside Next.js request context (e.g. unit tests)
    }

    return {
      success: true,
      message: 'Đã lưu tiến độ đọc.',
      data: {
        readPercentage: finalPercentage,
        completed: isCompleted,
      },
    };
  } catch (err) {
    console.error('Failed to record reading progress:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể lưu tiến độ đọc. Vui lòng thử lại.',
    };
  }
}

/**
 * Server Action: Clears reading history for a single article, a timeframe, or all.
 */
export async function clearReadingHistoryAction(
  input: ClearHistoryInput
): Promise<ActionResult<{ deletedCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để thực hiện thao tác này.',
    };
  }
  const userId = session.user.id;

  const parsed = clearHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { articleId, timeframe } = parsed.data;

  // Rate limit: 10 clear requests/minute
  const rateLimitResult = await rateLimit(`clear-history:${userId}`, 10);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Bạn đã thực hiện thao tác xoá quá nhiều lần. Vui lòng thử lại sau 1 phút.',
    };
  }

  try {
    let deletedCount = 0;

    if (articleId) {
      const deleteResult = await prisma.readingHistory.deleteMany({
        where: { userId, articleId },
      });
      deletedCount = deleteResult.count;

      void auditLog({
        userId,
        action: 'CLEAR_READING_HISTORY_ITEM',
        entityType: 'ReadingHistory',
        entityId: articleId,
        metadata: { articleId },
      });
    } else if (timeframe === '7d') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const deleteResult = await prisma.readingHistory.deleteMany({
        where: { userId, lastReadAt: { gte: cutoff } },
      });
      deletedCount = deleteResult.count;

      void auditLog({
        userId,
        action: 'CLEAR_READING_HISTORY_TIMEFRAME',
        entityType: 'ReadingHistory',
        entityId: userId,
        metadata: { timeframe: '7d', deletedCount },
      });
    } else if (timeframe === '30d') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const deleteResult = await prisma.readingHistory.deleteMany({
        where: { userId, lastReadAt: { gte: cutoff } },
      });
      deletedCount = deleteResult.count;

      void auditLog({
        userId,
        action: 'CLEAR_READING_HISTORY_TIMEFRAME',
        entityType: 'ReadingHistory',
        entityId: userId,
        metadata: { timeframe: '30d', deletedCount },
      });
    } else if (timeframe === 'all') {
      const deleteResult = await prisma.readingHistory.deleteMany({
        where: { userId },
      });
      deletedCount = deleteResult.count;

      void auditLog({
        userId,
        action: 'CLEAR_READING_HISTORY_ALL',
        entityType: 'ReadingHistory',
        entityId: userId,
        metadata: { deletedCount },
      });
    }

    try {
      revalidateTag(`user-history-${userId}`);
      revalidateTag(`user-stats-${userId}`);
    } catch {
      // Ignore in tests
    }

    return {
      success: true,
      message: `Đã xoá ${deletedCount} mục khỏi lịch sử đọc.`,
      data: { deletedCount },
    };
  } catch (err) {
    console.error('Failed to clear reading history:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Đã xảy ra lỗi khi xoá lịch sử đọc.',
    };
  }
}

/**
 * Server Action: Synchronizes guest reading history from localStorage into the user account.
 */
export async function syncGuestHistoryAction(
  input: SyncGuestHistoryInput
): Promise<ActionResult<{ syncedCount: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để đồng bộ lịch sử đọc.',
    };
  }
  const userId = session.user.id;

  const parsed = syncGuestHistorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: 'Dữ liệu đồng bộ không hợp lệ.',
    };
  }
  const { items } = parsed.data;
  if (items.length === 0) {
    return { success: true, data: { syncedCount: 0 } };
  }

  try {
    let syncedCount = 0;
    for (const item of items) {
      const article = await prisma.article.findUnique({
        where: { id: item.articleId },
        select: { id: true },
      });
      if (!article) continue;

      const existing = await prisma.readingHistory.findUnique({
        where: { userId_articleId: { userId, articleId: item.articleId } },
      });

      const finalPercentage = existing
        ? Math.max(existing.readPercentage, item.readPercentage)
        : item.readPercentage;
      const isCompleted = finalPercentage >= 90 || Boolean(existing?.completed);
      const readDate = item.lastReadAt ? new Date(item.lastReadAt) : new Date();

      await prisma.readingHistory.upsert({
        where: { userId_articleId: { userId, articleId: item.articleId } },
        create: {
          userId,
          articleId: item.articleId,
          readPercentage: finalPercentage,
          completed: isCompleted,
          lastReadAt: readDate,
        },
        update: {
          readPercentage: finalPercentage,
          completed: isCompleted,
          lastReadAt: existing && existing.lastReadAt > readDate ? existing.lastReadAt : readDate,
        },
      });
      syncedCount++;
    }

    try {
      revalidateTag(`user-history-${userId}`);
      revalidateTag(`user-stats-${userId}`);
    } catch {
      // Ignore
    }

    return {
      success: true,
      message: `Đã đồng bộ ${syncedCount} bài viết vào tài khoản.`,
      data: { syncedCount },
    };
  } catch (err) {
    console.error('Failed to sync guest reading history:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể đồng bộ lịch sử đọc.',
    };
  }
}
