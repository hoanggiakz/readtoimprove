import { z } from 'zod';
import { CefrLevel } from '@prisma/client';

export const wordBankQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'Tối đa 100 ký tự')
    .optional()
    .transform((v) => {
      if (!v || v.length < 2) return undefined;
      return v;
    }),
  cefr: z.union([z.nativeEnum(CefrLevel), z.literal('ALL')]).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type WordBankQuery = z.infer<typeof wordBankQuerySchema>;

export const saveVocabularySchema = z.object({
  vocabularyId: z.string().min(1, 'Mã từ vựng không được để trống'),
});

export type SaveVocabularyInput = z.infer<typeof saveVocabularySchema>;

export const unsaveVocabularySchema = z.object({
  vocabularyId: z.string().min(1, 'Mã từ vựng không được để trống'),
});

export type UnsaveVocabularyInput = z.infer<typeof unsaveVocabularySchema>;
