'use server';

import { revalidateTag } from 'next/cache';
import { ArticleStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import {
  favoriteArticleSchema,
  unfavoriteArticleSchema,
  FavoriteArticleInput,
  UnfavoriteArticleInput,
} from '@/validations/user-history';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Server Action: Favorites an article with explicit intent (idempotent upsert).
 */
export async function favoriteArticleAction(
  input: FavoriteArticleInput
): Promise<ActionResult<{ isFavorited: true; articleId: string }>> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để lưu bài viết vào mục yêu thích.',
    };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = favoriteArticleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { articleId } = parsed.data;

  // 3. Rate limit check (30 favorites/minute/user)
  const rateLimitResult = await rateLimit(`favorite:${userId}`, 30);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Bạn đã thực hiện thao tác quá nhiều lần. Vui lòng thử lại sau 1 phút.',
    };
  }

  // 4. Validate article existence and published status
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { id: true, status: true },
  });
  if (!article || article.status !== ArticleStatus.PUBLISHED) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Bài viết không tồn tại hoặc chưa được xuất bản.',
    };
  }

  // 5. Idempotent upsert
  try {
    await prisma.favorite.upsert({
      where: {
        userId_articleId: { userId, articleId },
      },
      create: { userId, articleId },
      update: {},
    });

    // 6. Audit log
    void auditLog({
      userId,
      action: 'FAVORITE_ARTICLE',
      entityType: 'Favorite',
      entityId: articleId,
      metadata: { articleId },
    });

    // 7. Tag revalidation
    try {
      revalidateTag(`user-favorites-${userId}`);
    } catch {
      // Ignore outside request context
    }

    return {
      success: true,
      message: 'Đã thêm vào danh sách yêu thích.',
      data: { isFavorited: true, articleId },
    };
  } catch (err) {
    console.error('Failed to favorite article:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể thêm vào mục yêu thích. Vui lòng thử lại.',
    };
  }
}

/**
 * Server Action: Unfavorites an article with explicit intent (idempotent delete).
 */
export async function unfavoriteArticleAction(
  input: UnfavoriteArticleInput
): Promise<ActionResult<{ isFavorited: false; articleId: string }>> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để thao tác.',
    };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = unfavoriteArticleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { articleId } = parsed.data;

  // 3. Rate limit check
  const rateLimitResult = await rateLimit(`favorite:${userId}`, 30);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Bạn đã thực hiện thao tác quá nhiều lần. Vui lòng thử lại sau 1 phút.',
    };
  }

  // 4. Idempotent deletion
  try {
    await prisma.favorite.deleteMany({
      where: { userId, articleId },
    });

    // 5. Audit log
    void auditLog({
      userId,
      action: 'UNFAVORITE_ARTICLE',
      entityType: 'Favorite',
      entityId: articleId,
      metadata: { articleId },
    });

    // 6. Tag revalidation
    try {
      revalidateTag(`user-favorites-${userId}`);
    } catch {
      // Ignore outside request context
    }

    return {
      success: true,
      message: 'Đã xoá khỏi danh sách yêu thích.',
      data: { isFavorited: false, articleId },
    };
  } catch (err) {
    console.error('Failed to unfavorite article:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể xoá khỏi mục yêu thích. Vui lòng thử lại.',
    };
  }
}
