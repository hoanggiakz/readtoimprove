import { z } from 'zod';
import { CefrLevel } from '@prisma/client';

export const recordProgressSchema = z.object({
  articleId: z.string().min(1, 'Mã bài viết không được để trống.'),
  readPercentage: z.number().int('Tiến độ phải là số nguyên.').min(0, 'Tiến độ tối thiểu là 0%.').max(100, 'Tiến độ tối đa là 100%.'),
});

export type RecordProgressInput = z.infer<typeof recordProgressSchema>;

export const favoriteArticleSchema = z.object({
  articleId: z.string().min(1, 'Mã bài viết không được để trống.'),
});

export type FavoriteArticleInput = z.infer<typeof favoriteArticleSchema>;

export const unfavoriteArticleSchema = z.object({
  articleId: z.string().min(1, 'Mã bài viết không được để trống.'),
});

export type UnfavoriteArticleInput = z.infer<typeof unfavoriteArticleSchema>;

export const clearHistorySchema = z
  .object({
    articleId: z.string().optional(),
    timeframe: z.enum(['all', '7d', '30d']).optional(),
  })
  .refine((data) => data.articleId || data.timeframe, {
    message: 'Vui lòng chỉ định bài viết hoặc khoảng thời gian cần xoá.',
  });

export type ClearHistoryInput = z.infer<typeof clearHistorySchema>;

export const updateGoalSchema = z.object({
  weeklyGoal: z
    .number()
    .int('Mục tiêu phải là số nguyên.')
    .min(1, 'Mục tiêu tối thiểu là 1 bài/tuần.')
    .max(50, 'Mục tiêu tối đa là 50 bài/tuần.'),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  category: z.string().regex(/^[a-z0-9-]*$/, 'Slug danh mục không hợp lệ.').optional(),
  level: z.nativeEnum(CefrLevel).optional(),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;

export const syncGuestHistoryItemSchema = z.object({
  articleId: z.string().min(1),
  readPercentage: z.number().int().min(0).max(100),
  lastReadAt: z.string().optional(),
});

export const syncGuestHistorySchema = z.object({
  items: z.array(syncGuestHistoryItemSchema).max(100, 'Tối đa 100 mục lịch sử đồng bộ.'),
});

export type SyncGuestHistoryInput = z.infer<typeof syncGuestHistorySchema>;
