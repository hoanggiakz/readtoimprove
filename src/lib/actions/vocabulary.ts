'use server';

import { revalidateTag } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { saveVocabularySchema, unsaveVocabularySchema } from '@/validations/word-bank';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Server Action: Saves a vocabulary item to the authenticated user's personal Word Bank.
 * Idempotent, concurrency-safe atomic upsert with existence and rate-limit checks.
 */
export async function saveVocabularyAction(
  input: { vocabularyId: string }
): Promise<ActionResult<{ isSaved: true; vocabularyId: string }>> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để lưu từ vựng vào sổ từ cá nhân.',
    };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = saveVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { vocabularyId } = parsed.data;

  // 3. Rate limit check (30 requests/minute/user)
  const rateLimitResult = await rateLimit(`save:${userId}`);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Bạn đã thực hiện quá nhiều thao tác. Vui lòng thử lại sau 1 phút.',
    };
  }

  // 4. Validate vocabulary existence before upsert
  const vocab = await prisma.vocabulary.findUnique({
    where: { id: vocabularyId },
    select: { id: true },
  });
  if (!vocab) {
    return {
      success: false,
      error: 'NOT_FOUND',
      message: 'Từ vựng không tồn tại trong hệ thống.',
    };
  }

  // 5. Atomic upsert
  try {
    await prisma.userSavedVocabulary.upsert({
      where: {
        userId_vocabularyId: { userId, vocabularyId },
      },
      create: { userId, vocabularyId },
      update: {},
    });

    // 6. Audit log (fire-and-forget)
    void auditLog({
      userId,
      action: 'SAVE_VOCABULARY',
      entityType: 'UserSavedVocabulary',
      entityId: vocabularyId,
    });

    // 7. Tag-based cache invalidation
    try {
      revalidateTag(`word-bank-${userId}`);
    } catch {
      // Revalidation may throw outside Next.js request context (e.g. unit tests)
    }

    return {
      success: true,
      message: 'Đã lưu vào Sổ từ vựng thành công.',
      data: { isSaved: true, vocabularyId },
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint race condition -> already saved, treat as success
        return {
          success: true,
          message: 'Từ vựng đã có trong Sổ từ vựng.',
          data: { isSaved: true, vocabularyId },
        };
      }
    }
    console.error('Error saving vocabulary:', error);
    return {
      success: false,
      error: 'INTERNAL',
      message: 'Có lỗi xảy ra khi lưu từ vựng. Vui lòng thử lại.',
    };
  }
}

/**
 * Server Action: Removes a vocabulary item from the authenticated user's personal Word Bank.
 * Idempotent delete operation enforcing tenant isolation.
 */
export async function unsaveVocabularyAction(
  input: { vocabularyId: string }
): Promise<ActionResult<{ isSaved: false; vocabularyId: string }>> {
  // 1. Authenticate user
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để thực hiện thao tác này.',
    };
  }
  const userId = session.user.id;

  // 2. Validate input
  const parsed = unsaveVocabularySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Dữ liệu không hợp lệ.',
    };
  }
  const { vocabularyId } = parsed.data;

  // 3. Rate limit check
  const rateLimitResult = await rateLimit(`unsave:${userId}`);
  if (!rateLimitResult.success) {
    return {
      success: false,
      error: 'RATE_LIMITED',
      message: 'Bạn đã thực hiện quá nhiều thao tác. Vui lòng thử lại sau 1 phút.',
    };
  }

  try {
    // 4. Idempotent delete: returns count: 0 if not present
    const result = await prisma.userSavedVocabulary.deleteMany({
      where: { userId, vocabularyId },
    });

    if (result.count > 0) {
      void auditLog({
        userId,
        action: 'UNSAVE_VOCABULARY',
        entityType: 'UserSavedVocabulary',
        entityId: vocabularyId,
      });
    }

    try {
      revalidateTag(`word-bank-${userId}`);
    } catch {
      // Ignore revalidate outside Next.js request context
    }

    return {
      success: true,
      message: 'Đã xóa từ vựng khỏi Sổ từ vựng.',
      data: { isSaved: false, vocabularyId },
    };
  } catch (error) {
    console.error('Error unsaving vocabulary:', error);
    return {
      success: false,
      error: 'INTERNAL',
      message: 'Có lỗi xảy ra khi xóa từ vựng. Vui lòng thử lại.',
    };
  }
}
