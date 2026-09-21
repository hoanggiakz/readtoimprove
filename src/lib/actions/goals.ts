'use server';

import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { updateGoalSchema, UpdateGoalInput } from '@/validations/user-history';

export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

/**
 * Server Action: Updates the user's weekly reading goal.
 */
export async function updateReadingGoalAction(
  input: UpdateGoalInput
): Promise<ActionResult<{ weeklyArticleGoal: number }>> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Vui lòng đăng nhập để cập nhật mục tiêu.',
    };
  }
  const userId = session.user.id;

  const parsed = updateGoalSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'INVALID_INPUT',
      message: parsed.error.errors[0]?.message || 'Mục tiêu không hợp lệ.',
    };
  }
  const { weeklyGoal } = parsed.data;

  try {
    const goal = await prisma.userReadingGoal.upsert({
      where: { userId },
      create: {
        userId,
        weeklyArticleGoal: weeklyGoal,
      },
      update: {
        weeklyArticleGoal: weeklyGoal,
      },
    });

    try {
      revalidateTag(`user-stats-${userId}`);
    } catch {
      // Ignore in tests
    }

    return {
      success: true,
      message: 'Đã cập nhật mục tiêu đọc sách hàng tuần.',
      data: { weeklyArticleGoal: goal.weeklyArticleGoal },
    };
  } catch (err) {
    console.error('Failed to update reading goal:', err);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Không thể cập nhật mục tiêu lúc này.',
    };
  }
}
