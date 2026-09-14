import { z } from 'zod';
import { CefrLevel } from '@prisma/client';

export const searchParamsSchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, 'Từ khóa tìm kiếm không được vượt quá 100 ký tự')
    .optional(),
  category: z
    .string()
    .trim()
    .max(50)
    .regex(/^[a-z0-9-]*$/, 'Slug chuyên mục không hợp lệ')
    .optional(),
  level: z.nativeEnum(CefrLevel).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export type SearchParamsInput = z.infer<typeof searchParamsSchema>;

export const suggestionsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Từ khóa gợi ý tối thiểu 2 ký tự')
    .max(100, 'Từ khóa gợi ý tối đa 100 ký tự'),
});

export type SuggestionsQueryInput = z.infer<typeof suggestionsQuerySchema>;

export interface SearchSuggestionItem {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  cefrLevel: CefrLevel;
  readingTimeMinutes: number;
  primaryCategory?: {
    id: string;
    slug: string;
    nameVi: string;
    nameEn: string;
  } | null;
}

export interface SearchResultItem {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  excerptEn: string | null;
  excerptVi: string | null;
  thumbnailUrl: string | null;
  cefrLevel: CefrLevel;
  readingTimeMinutes: number;
  publishedAt: Date | null;
  sourceName: string;
  categories: Array<{
    category: {
      id: string;
      slug: string;
      nameVi: string;
      nameEn: string;
    };
  }>;
  _count: {
    sentences: number;
  };
}

export interface PaginatedSearchResult {
  articles: SearchResultItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  activeQuery?: string;
  activeCategory?: string;
  activeCefrLevel?: CefrLevel;
}
