import { z } from "zod";

export const cefrLevelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
export const articleStatusEnum = z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]);
export const userRoleEnum = z.enum(["USER", "ADMIN"]);

// Article Schemas
export const articleInputSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug phải có ít nhất 3 ký tự")
    .max(120, "Slug không vượt quá 120 ký tự")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ được chứa chữ cái thường, số và dấu gạch ngang"),
  titleEn: z.string().min(5, "Tiêu đề tiếng Anh tối thiểu 5 ký tự").max(255),
  titleVi: z.string().min(5, "Tiêu đề tiếng Việt tối thiểu 5 ký tự").max(255),
  excerptEn: z.string().max(500).optional().nullable(),
  excerptVi: z.string().max(500).optional().nullable(),
  sourceName: z.string().min(2, "Tên nguồn tin là bắt buộc").max(100),
  sourceUrl: z.string().url("URL nguồn tin không hợp lệ").max(500),
  originalPublishedAt: z.string().datetime({ offset: true }).optional().nullable(),
  thumbnailUrl: z.string().url("URL hình ảnh thu nhỏ không hợp lệ").max(500).optional().nullable().or(z.literal("")),
  videoUrl: z.string().url("URL video không hợp lệ").max(500).optional().nullable().or(z.literal("")),
  cefrLevel: cefrLevelEnum.default("B2"),
  status: articleStatusEnum.default("DRAFT"),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
  readingTimeMinutes: z.coerce.number().int().min(1).max(60).default(3),
  categoryIds: z.array(z.string()).default([]),

  // SEO Fields
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  canonicalUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
  ogImage: z.string().url().max(500).optional().nullable().or(z.literal("")),
});

export type ArticleInput = z.infer<typeof articleInputSchema>;

export const articleStatusChangeSchema = z.object({
  articleId: z.string().min(1, "ID bài viết không hợp lệ"),
  status: articleStatusEnum,
});

export const articleDeleteSchema = z.object({
  articleId: z.string().min(1, "ID bài viết không hợp lệ"),
  confirmArchiveDelete: z.boolean().optional().default(false),
});

// Bilingual Sentence Schemas
export const sentenceInputSchema = z.object({
  articleId: z.string().min(1, "ID bài viết không hợp lệ"),
  orderIndex: z.coerce.number().int().min(0, "Thứ tự câu phải >= 0"),
  textEn: z.string().min(1, "Câu tiếng Anh không được để trống").max(2000),
  textVi: z.string().min(1, "Bản dịch tiếng Việt không được để trống").max(2000),
});

export type SentenceInput = z.infer<typeof sentenceInputSchema>;

export const sentenceUpdateSchema = z.object({
  id: z.string().min(1, "ID câu không hợp lệ"),
  textEn: z.string().min(1, "Câu tiếng Anh không được để trống").max(2000),
  textVi: z.string().min(1, "Bản dịch tiếng Việt không được để trống").max(2000),
});

export const sentenceReorderSchema = z.object({
  articleId: z.string().min(1, "ID bài viết không hợp lệ"),
  sentenceIds: z.array(z.string()).min(1, "Danh sách câu không được để trống"),
});

// Vocabulary Schemas
export const vocabularyInputSchema = z.object({
  word: z.string().min(1, "Từ vựng không được để trống").max(100),
  normalizedLemma: z.string().min(1, "Từ gốc (lemma) không được để trống").max(100),
  ipa: z.string().max(100).optional().nullable(),
  pos: z.string().max(50).optional().nullable(),
  meaningVi: z.string().min(1, "Định nghĩa tiếng Việt không được để trống").max(500),
  exampleEn: z.string().max(1000).optional().nullable(),
  exampleVi: z.string().max(1000).optional().nullable(),
  cefrLevel: cefrLevelEnum.default("B2"),
  audioUrl: z.string().url().max(500).optional().nullable().or(z.literal("")),
});

export type VocabularyInput = z.infer<typeof vocabularyInputSchema>;

// Sentence Vocabulary Tagging Schema
export const sentenceVocabTagSchema = z.object({
  sentenceId: z.string().min(1, "ID câu không hợp lệ"),
  vocabularyId: z.string().min(1, "ID từ vựng không hợp lệ"),
  startOffset: z.coerce.number().int().min(0, "startOffset phải >= 0"),
  endOffset: z.coerce.number().int().min(1, "endOffset phải >= 1"),
  highlightedText: z.string().min(1, "highlightedText không được để trống"),
});

export type SentenceVocabTagInput = z.infer<typeof sentenceVocabTagSchema>;

// Category Schemas
export const categoryInputSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug tối thiểu 2 ký tự")
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug chỉ chứa chữ thường, số và gạch ngang"),
  nameEn: z.string().min(2, "Tên tiếng Anh tối thiểu 2 ký tự").max(100),
  nameVi: z.string().min(2, "Tên tiếng Việt tối thiểu 2 ký tự").max(100),
  description: z.string().max(300).optional().nullable(),
  orderIndex: z.coerce.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// User Access Management Schemas
export const userStatusSchema = z.object({
  userId: z.string().min(1, "ID người dùng không hợp lệ"),
  isActive: z.boolean(),
});

export const userRoleSchema = z.object({
  userId: z.string().min(1, "ID người dùng không hợp lệ"),
  role: userRoleEnum,
});
