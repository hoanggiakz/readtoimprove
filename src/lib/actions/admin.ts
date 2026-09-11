"use server";

import { revalidatePath } from "next/cache";
import { ArticleStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, logAudit } from "@/lib/security";
import { validateHighlightOffsets } from "@/lib/offsets";
import {
  articleInputSchema,
  articleDeleteSchema,
  sentenceInputSchema,
  sentenceUpdateSchema,
  sentenceReorderSchema,
  vocabularyInputSchema,
  sentenceVocabTagSchema,
  categoryInputSchema,
  userRoleEnum,
} from "@/validations/admin";

export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// ============================================================================
// ARTICLE ACTIONS
// ============================================================================

export async function createArticleAction(rawInput: unknown): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await requireAdmin();

  const parse = articleInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu bài viết không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const { categoryIds, ...articleData } = parse.data;

  // Check unique slug
  const existing = await prisma.article.findUnique({
    where: { slug: articleData.slug },
  });
  if (existing) {
    return {
      success: false,
      error: `Slug '${articleData.slug}' đã tồn tại trong hệ thống. Vui lòng chọn slug khác.`,
    };
  }

  const article = await prisma.article.create({
    data: {
      slug: articleData.slug,
      titleEn: articleData.titleEn,
      titleVi: articleData.titleVi,
      excerptEn: articleData.excerptEn,
      excerptVi: articleData.excerptVi,
      sourceName: articleData.sourceName,
      sourceUrl: articleData.sourceUrl,
      originalPublishedAt: articleData.originalPublishedAt ? new Date(articleData.originalPublishedAt) : null,
      thumbnailUrl: articleData.thumbnailUrl || null,
      videoUrl: articleData.videoUrl || null,
      cefrLevel: articleData.cefrLevel,
      status: articleData.status,
      scheduledAt: articleData.scheduledAt ? new Date(articleData.scheduledAt) : null,
      publishedAt: articleData.status === ArticleStatus.PUBLISHED ? new Date() : null,
      readingTimeMinutes: articleData.readingTimeMinutes,
      metaTitle: articleData.metaTitle,
      metaDescription: articleData.metaDescription,
      canonicalUrl: articleData.canonicalUrl || null,
      ogImage: articleData.ogImage || null,
      categories: {
        create: categoryIds.map((catId) => ({
          category: { connect: { id: catId } },
        })),
      },
    },
  });

  await logAudit({
    userId: admin.id,
    action: "ARTICLE_CREATED",
    entity: "Article",
    entityId: article.id,
    details: { slug: article.slug, titleEn: article.titleEn, status: article.status },
  });

  revalidatePath("/secure-console-x7/articles");
  return { success: true, data: { id: article.id, slug: article.slug } };
}

export async function updateArticleAction(
  id: string,
  rawInput: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  const admin = await requireAdmin();

  const parse = articleInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu bài viết không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const { categoryIds, ...articleData } = parse.data;

  // Verify article exists
  const existing = await prisma.article.findUnique({
    where: { id },
  });
  if (!existing) {
    return { success: false, error: "Không tìm thấy bài viết" };
  }

  // Check unique slug if changed
  if (articleData.slug !== existing.slug) {
    const slugConflict = await prisma.article.findUnique({
      where: { slug: articleData.slug },
    });
    if (slugConflict) {
      return { success: false, error: `Slug '${articleData.slug}' đã được sử dụng bởi bài viết khác.` };
    }
  }

  // Execute update and category synchronization in transaction
  const updated = await prisma.$transaction(async (tx) => {
    // Delete existing category relations
    await tx.articleCategory.deleteMany({
      where: { articleId: id },
    });

    return tx.article.update({
      where: { id },
      data: {
        slug: articleData.slug,
        titleEn: articleData.titleEn,
        titleVi: articleData.titleVi,
        excerptEn: articleData.excerptEn,
        excerptVi: articleData.excerptVi,
        sourceName: articleData.sourceName,
        sourceUrl: articleData.sourceUrl,
        originalPublishedAt: articleData.originalPublishedAt ? new Date(articleData.originalPublishedAt) : null,
        thumbnailUrl: articleData.thumbnailUrl || null,
        videoUrl: articleData.videoUrl || null,
        cefrLevel: articleData.cefrLevel,
        status: articleData.status,
        scheduledAt: articleData.scheduledAt ? new Date(articleData.scheduledAt) : null,
        publishedAt:
          articleData.status === ArticleStatus.PUBLISHED && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
        readingTimeMinutes: articleData.readingTimeMinutes,
        metaTitle: articleData.metaTitle,
        metaDescription: articleData.metaDescription,
        canonicalUrl: articleData.canonicalUrl || null,
        ogImage: articleData.ogImage || null,
        categories: {
          create: categoryIds.map((catId) => ({
            category: { connect: { id: catId } },
          })),
        },
      },
    });
  });

  await logAudit({
    userId: admin.id,
    action: "ARTICLE_UPDATED",
    entity: "Article",
    entityId: updated.id,
    details: { slug: updated.slug, titleEn: updated.titleEn, status: updated.status },
  });

  revalidatePath("/secure-console-x7/articles");
  revalidatePath(`/secure-console-x7/articles/${id}/edit`);
  return { success: true, data: { id: updated.id, slug: updated.slug } };
}

export async function deleteArticleAction(
  id: string,
  confirmArchiveDelete: boolean = false
): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = articleDeleteSchema.safeParse({ articleId: id, confirmArchiveDelete });
  if (!parse.success) {
    return { success: false, error: "Yêu cầu xóa không hợp lệ" };
  }

  const article = await prisma.article.findUnique({
    where: { id },
    include: { _count: { select: { sentences: true } } },
  });

  if (!article) {
    return { success: false, error: "Bài viết không tồn tại." };
  }

  // Deletion Policy Guard:
  // 1. PUBLISHED articles CANNOT be deleted directly. Must be archived first.
  if (article.status === ArticleStatus.PUBLISHED) {
    return {
      success: false,
      error: "Không thể xóa bài viết đang ở trạng thái ĐÃ XUẤT BẢN (PUBLISHED). Vui lòng chuyển bài viết sang trạng thái LƯU TRỮ (ARCHIVED) trước.",
    };
  }

  // 2. ARCHIVED articles require explicit confirmation flag
  if (article.status === ArticleStatus.ARCHIVED && !confirmArchiveDelete) {
    return {
      success: false,
      error: "Xóa bài viết lưu trữ yêu cầu xác nhận rõ ràng (confirmArchiveDelete: true).",
    };
  }

  // Safe deletion: Article -> Sentences -> SentenceVocabularies cascades in PostgreSQL
  // Global Vocabulary table remains untouched!
  await prisma.article.delete({
    where: { id },
  });

  await logAudit({
    userId: admin.id,
    action: "ARTICLE_DELETED",
    entity: "Article",
    entityId: id,
    details: {
      deletedTitle: article.titleEn,
      deletedSlug: article.slug,
      sentenceCount: article._count.sentences,
      status: article.status,
    },
  });

  revalidatePath("/secure-console-x7/articles");
  return { success: true, data: { id } };
}

export async function setArticleStatusAction(
  articleId: string,
  targetStatus: ArticleStatus
): Promise<ActionResult<{ id: string; status: ArticleStatus }>> {
  const admin = await requireAdmin();

  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    return { success: false, error: "Bài viết không tồn tại" };
  }

  const currentStatus = article.status;

  // Explicit State Machine Validation
  if (currentStatus === ArticleStatus.PUBLISHED) {
    if (targetStatus === ArticleStatus.DRAFT) {
      return {
        success: false,
        error: "Chuyển trực tiếp từ PUBLISHED sang DRAFT bị cấm. Vui lòng chuyển sang ARCHIVED trước.",
      };
    }
    if (targetStatus === ArticleStatus.PENDING_REVIEW) {
      return {
        success: false,
        error: "Chuyển từ PUBLISHED sang PENDING_REVIEW không hợp lệ. Vui lòng chuyển sang ARCHIVED trước.",
      };
    }
  }

  // Calculate publishedAt logic
  let newPublishedAt = article.publishedAt;
  if (targetStatus === ArticleStatus.PUBLISHED && !article.publishedAt) {
    newPublishedAt = new Date();
  }
  // If moving to ARCHIVED, publishedAt remains PRESERVED for historical record.

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      status: targetStatus,
      publishedAt: newPublishedAt,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "ARTICLE_STATUS_CHANGED",
    entity: "Article",
    entityId: articleId,
    details: { previousStatus: currentStatus, targetStatus, publishedAt: newPublishedAt },
  });

  revalidatePath("/secure-console-x7/articles");
  return { success: true, data: { id: updated.id, status: updated.status } };
}

export async function processScheduledArticlesAction(): Promise<ActionResult<{ publishedCount: number }>> {
  const admin = await requireAdmin();
  const now = new Date();

  const dueArticles = await prisma.article.findMany({
    where: {
      status: { in: [ArticleStatus.DRAFT, ArticleStatus.PENDING_REVIEW] },
      scheduledAt: { lte: now },
    },
  });

  if (dueArticles.length === 0) {
    return { success: true, data: { publishedCount: 0 } };
  }

  const updated = await prisma.$transaction(
    dueArticles.map((article) =>
      prisma.article.update({
        where: { id: article.id },
        data: {
          status: ArticleStatus.PUBLISHED,
          publishedAt: article.scheduledAt || now,
          scheduledAt: null,
        },
      })
    )
  );

  await logAudit({
    userId: admin.id,
    action: "SCHEDULED_ARTICLES_PROCESSED",
    entity: "Article",
    details: { publishedCount: updated.length, articleIds: dueArticles.map((a) => a.id) },
  });

  revalidatePath("/secure-console-x7/articles");
  return { success: true, data: { publishedCount: updated.length } };
}

export async function processScheduledArticlesFormAction(): Promise<void> {
  await processScheduledArticlesAction();
}

// ============================================================================
// BILINGUAL SENTENCE ACTIONS
// ============================================================================

export async function createSentenceAction(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = sentenceInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu câu không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const { articleId, orderIndex, textEn, textVi } = parse.data;

  // Check unique orderIndex for article
  const conflict = await prisma.sentence.findUnique({
    where: {
      articleId_orderIndex: {
        articleId,
        orderIndex,
      },
    },
  });

  if (conflict) {
    return {
      success: false,
      error: `Thứ tự câu ${orderIndex} đã tồn tại trong bài viết. Vui lòng chọn thứ tự khác hoặc thêm vào cuối.`,
    };
  }

  const sentence = await prisma.sentence.create({
    data: {
      articleId,
      orderIndex,
      textEn,
      textVi,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "SENTENCE_CREATED",
    entity: "Sentence",
    entityId: sentence.id,
    details: { articleId, orderIndex },
  });

  revalidatePath(`/secure-console-x7/articles/${articleId}/sentences`);
  return { success: true, data: { id: sentence.id } };
}

export async function updateSentenceAction(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = sentenceUpdateSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu cập nhật câu không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const { id, textEn, textVi } = parse.data;

  const existing = await prisma.sentence.findUnique({
    where: { id },
    include: { vocabularies: true },
  });

  if (!existing) {
    return { success: false, error: "Câu không tồn tại" };
  }

  // Validate existing highlights against new text
  for (const vocab of existing.vocabularies) {
    const val = validateHighlightOffsets(textEn, vocab.startOffset, vocab.endOffset, vocab.highlightedText);
    if (!val.valid) {
      return {
        success: false,
        error: `Không thể cập nhật: Highlight '${vocab.highlightedText}' (vị trí ${vocab.startOffset}-${vocab.endOffset}) không còn khớp với nội dung câu mới. Vui lòng gỡ highlight trước khi sửa câu.`,
      };
    }
  }

  const updated = await prisma.sentence.update({
    where: { id },
    data: { textEn, textVi },
  });

  await logAudit({
    userId: admin.id,
    action: "SENTENCE_UPDATED",
    entity: "Sentence",
    entityId: id,
    details: { articleId: existing.articleId, orderIndex: existing.orderIndex },
  });

  revalidatePath(`/secure-console-x7/articles/${existing.articleId}/sentences`);
  return { success: true, data: { id: updated.id } };
}

export async function deleteSentenceAction(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const sentence = await prisma.sentence.findUnique({
    where: { id },
  });

  if (!sentence) {
    return { success: false, error: "Câu không tồn tại" };
  }

  const { articleId, orderIndex } = sentence;

  // Deleting sentence cascades to SentenceVocabulary in PostgreSQL, preserving Vocabulary.
  // Re-number remaining sentences atomically in transaction
  await prisma.$transaction(async (tx) => {
    await tx.sentence.delete({ where: { id } });

    const remaining = await tx.sentence.findMany({
      where: { articleId },
      orderBy: { orderIndex: "asc" },
    });

    // Re-index remaining sequentially: 0, 1, 2...
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        await tx.sentence.update({
          where: { id: remaining[i].id },
          data: { orderIndex: -(i + 1) }, // Temporary negative index
        });
      }
    }

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        await tx.sentence.update({
          where: { id: remaining[i].id },
          data: { orderIndex: i },
        });
      }
    }
  });

  await logAudit({
    userId: admin.id,
    action: "SENTENCE_DELETED",
    entity: "Sentence",
    entityId: id,
    details: { articleId, deletedOrderIndex: orderIndex },
  });

  revalidatePath(`/secure-console-x7/articles/${articleId}/sentences`);
  return { success: true, data: { id } };
}

export async function reorderSentencesAction(rawInput: unknown): Promise<ActionResult<{ articleId: string }>> {
  const admin = await requireAdmin();

  const parse = sentenceReorderSchema.safeParse(rawInput);
  if (!parse.success) {
    return { success: false, error: "Dữ liệu sắp xếp câu không hợp lệ" };
  }

  const { articleId, sentenceIds } = parse.data;

  // Execute reorder inside transaction using temporary negative offsets to eliminate unique constraint collision
  await prisma.$transaction(async (tx) => {
    // Step 1: Set temporary negative orderIndex
    for (let i = 0; i < sentenceIds.length; i++) {
      await tx.sentence.update({
        where: { id: sentenceIds[i] },
        data: { orderIndex: -(i + 1) },
      });
    }

    // Step 2: Set final positive orderIndex
    for (let i = 0; i < sentenceIds.length; i++) {
      await tx.sentence.update({
        where: { id: sentenceIds[i] },
        data: { orderIndex: i },
      });
    }
  });

  await logAudit({
    userId: admin.id,
    action: "SENTENCE_REORDERED",
    entity: "Sentence",
    details: { articleId, count: sentenceIds.length },
  });

  revalidatePath(`/secure-console-x7/articles/${articleId}/sentences`);
  return { success: true, data: { articleId } };
}

// ============================================================================
// VOCABULARY & HIGHLIGHT ACTIONS
// ============================================================================

export async function createVocabularyAction(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = vocabularyInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu từ vựng không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const vocab = await prisma.vocabulary.create({
    data: {
      word: parse.data.word.trim(),
      normalizedLemma: parse.data.normalizedLemma.trim().toLowerCase(),
      ipa: parse.data.ipa?.trim() || null,
      pos: parse.data.pos?.trim() || null,
      meaningVi: parse.data.meaningVi.trim(),
      exampleEn: parse.data.exampleEn?.trim() || null,
      exampleVi: parse.data.exampleVi?.trim() || null,
      cefrLevel: parse.data.cefrLevel,
      audioUrl: parse.data.audioUrl || null,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "VOCABULARY_CREATED",
    entity: "Vocabulary",
    entityId: vocab.id,
    details: { word: vocab.word, cefrLevel: vocab.cefrLevel },
  });

  revalidatePath("/secure-console-x7/vocabulary");
  return { success: true, data: { id: vocab.id } };
}

export async function updateVocabularyAction(id: string, rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = vocabularyInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu từ vựng không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.vocabulary.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Từ vựng không tồn tại" };
  }

  const updated = await prisma.vocabulary.update({
    where: { id },
    data: {
      word: parse.data.word.trim(),
      normalizedLemma: parse.data.normalizedLemma.trim().toLowerCase(),
      ipa: parse.data.ipa?.trim() || null,
      pos: parse.data.pos?.trim() || null,
      meaningVi: parse.data.meaningVi.trim(),
      exampleEn: parse.data.exampleEn?.trim() || null,
      exampleVi: parse.data.exampleVi?.trim() || null,
      cefrLevel: parse.data.cefrLevel,
      audioUrl: parse.data.audioUrl || null,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "VOCABULARY_UPDATED",
    entity: "Vocabulary",
    entityId: id,
    details: { word: updated.word, cefrLevel: updated.cefrLevel },
  });

  revalidatePath("/secure-console-x7/vocabulary");
  return { success: true, data: { id: updated.id } };
}

export async function deleteVocabularyAction(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const vocab = await prisma.vocabulary.findUnique({
    where: { id },
  });

  if (!vocab) {
    return { success: false, error: "Từ vựng không tồn tại" };
  }

  // Global Vocabulary Hard Deletion Guard:
  // Reject deletion if referenced by SentenceVocabulary or UserSavedVocabulary
  const [sentenceCount, userSaveCount] = await Promise.all([
    prisma.sentenceVocabulary.count({ where: { vocabularyId: id } }),
    prisma.userSavedVocabulary.count({ where: { vocabularyId: id } }),
  ]);

  if (sentenceCount > 0 || userSaveCount > 0) {
    return {
      success: false,
      error: `Không thể xóa từ vựng '${vocab.word}'. Từ này đang được sử dụng trong ${sentenceCount} câu và ${userSaveCount} học viên đã lưu vào Word Bank. Vui lòng gỡ liên kết khỏi các câu trước khi xóa.`,
    };
  }

  await prisma.vocabulary.delete({
    where: { id },
  });

  await logAudit({
    userId: admin.id,
    action: "VOCABULARY_DELETED",
    entity: "Vocabulary",
    entityId: id,
    details: { word: vocab.word, cefrLevel: vocab.cefrLevel },
  });

  revalidatePath("/secure-console-x7/vocabulary");
  return { success: true, data: { id } };
}

export async function tagSentenceVocabularyAction(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = sentenceVocabTagSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu gắn thẻ từ vựng không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const { sentenceId, vocabularyId, startOffset, endOffset, highlightedText } = parse.data;

  // Verify Sentence & Vocabulary exist
  const [sentence, vocabulary] = await Promise.all([
    prisma.sentence.findUnique({ where: { id: sentenceId } }),
    prisma.vocabulary.findUnique({ where: { id: vocabularyId } }),
  ]);

  if (!sentence) return { success: false, error: "Câu không tồn tại" };
  if (!vocabulary) return { success: false, error: "Từ vựng không tồn tại" };

  // Strict Offset Mathematical Validation
  const validation = validateHighlightOffsets(sentence.textEn, startOffset, endOffset, highlightedText);
  if (!validation.valid) {
    return {
      success: false,
      error: `Lỗi vị trí ký tự: ${validation.error}`,
    };
  }

  const highlight = await prisma.sentenceVocabulary.create({
    data: {
      sentenceId,
      vocabularyId,
      startOffset,
      endOffset,
      highlightedText,
    },
  });

  await logAudit({
    userId: admin.id,
    action: "VOCABULARY_TAGGED",
    entity: "SentenceVocabulary",
    entityId: highlight.id,
    details: { sentenceId, vocabularyId, word: vocabulary.word, highlightedText, startOffset, endOffset },
  });

  revalidatePath(`/secure-console-x7/articles/${sentence.articleId}/sentences`);
  return { success: true, data: { id: highlight.id } };
}

export async function untagSentenceVocabularyAction(sentenceVocabularyId: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const highlight = await prisma.sentenceVocabulary.findUnique({
    where: { id: sentenceVocabularyId },
    include: { sentence: true, vocabulary: true },
  });

  if (!highlight) {
    return { success: false, error: "Thẻ từ vựng không tồn tại" };
  }

  // Delete SentenceVocabulary record. Global Vocabulary record remains untouched!
  await prisma.sentenceVocabulary.delete({
    where: { id: sentenceVocabularyId },
  });

  await logAudit({
    userId: admin.id,
    action: "VOCABULARY_UNTAGGED",
    entity: "SentenceVocabulary",
    entityId: sentenceVocabularyId,
    details: {
      sentenceId: highlight.sentenceId,
      vocabularyId: highlight.vocabularyId,
      word: highlight.vocabulary.word,
    },
  });

  revalidatePath(`/secure-console-x7/articles/${highlight.sentence.articleId}/sentences`);
  return { success: true, data: { id: sentenceVocabularyId } };
}

// ============================================================================
// CATEGORY ACTIONS
// ============================================================================

export async function createCategoryAction(rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = categoryInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu chuyên mục không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.category.findUnique({
    where: { slug: parse.data.slug },
  });
  if (existing) {
    return { success: false, error: `Slug chuyên mục '${parse.data.slug}' đã tồn tại.` };
  }

  const category = await prisma.category.create({
    data: parse.data,
  });

  await logAudit({
    userId: admin.id,
    action: "CATEGORY_CREATED",
    entity: "Category",
    entityId: category.id,
    details: { slug: category.slug, nameVi: category.nameVi },
  });

  revalidatePath("/secure-console-x7/categories");
  return { success: true, data: { id: category.id } };
}

export async function updateCategoryAction(id: string, rawInput: unknown): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const parse = categoryInputSchema.safeParse(rawInput);
  if (!parse.success) {
    return {
      success: false,
      error: "Dữ liệu chuyên mục không hợp lệ",
      errors: parse.error.flatten().fieldErrors,
    };
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Chuyên mục không tồn tại" };
  }

  if (parse.data.slug !== existing.slug) {
    const slugConflict = await prisma.category.findUnique({
      where: { slug: parse.data.slug },
    });
    if (slugConflict) {
      return { success: false, error: `Slug chuyên mục '${parse.data.slug}' đã được sử dụng.` };
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: parse.data,
  });

  await logAudit({
    userId: admin.id,
    action: "CATEGORY_UPDATED",
    entity: "Category",
    entityId: id,
    details: { slug: updated.slug, nameVi: updated.nameVi },
  });

  revalidatePath("/secure-console-x7/categories");
  return { success: true, data: { id: updated.id } };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await requireAdmin();

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  });

  if (!category) {
    return { success: false, error: "Chuyên mục không tồn tại" };
  }

  if (category._count.articles > 0) {
    return {
      success: false,
      error: `Không thể xóa chuyên mục '${category.nameVi}' vì đang chứa ${category._count.articles} bài viết. Vui lòng chuyển bài viết sang chuyên mục khác trước.`,
    };
  }

  await prisma.category.delete({ where: { id } });

  await logAudit({
    userId: admin.id,
    action: "CATEGORY_DELETED",
    entity: "Category",
    entityId: id,
    details: { slug: category.slug, nameVi: category.nameVi },
  });

  revalidatePath("/secure-console-x7/categories");
  return { success: true, data: { id } };
}

// ============================================================================
// USER ACCESS ACTIONS & SELF-LOCKOUT PREVENTION
// ============================================================================

export async function toggleUserActiveAction(userId: string): Promise<ActionResult<{ userId: string; isActive: boolean }>> {
  const admin = await requireAdmin();

  // Self-lockout prevention: Admin cannot deactivate themselves
  if (userId === admin.id) {
    return {
      success: false,
      error: "Không thể tự vô hiệu hóa tài khoản quản trị của chính mình.",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "Tài khoản không tồn tại" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await logAudit({
    userId: admin.id,
    action: updated.isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
    entity: "User",
    entityId: userId,
    details: { email: updated.email, isActive: updated.isActive },
  });

  revalidatePath("/secure-console-x7/users");
  return { success: true, data: { userId: updated.id, isActive: updated.isActive } };
}

export async function updateUserRoleAction(userId: string, newRole: Role): Promise<ActionResult<{ userId: string; role: Role }>> {
  const admin = await requireAdmin();

  const parseRole = userRoleEnum.safeParse(newRole);
  if (!parseRole.success) {
    return { success: false, error: "Vai trò người dùng không hợp lệ" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { success: false, error: "Tài khoản không tồn tại" };
  }

  // Self-demotion / Sole-admin lockout prevention:
  if (user.role === Role.ADMIN && newRole !== Role.ADMIN) {
    // Check how many active admins remain
    const activeAdminCount = await prisma.user.count({
      where: { role: Role.ADMIN, isActive: true },
    });

    if (activeAdminCount <= 1) {
      return {
        success: false,
        error: "Không thể hạ quyền Administrator cuối cùng trong hệ thống. Cần có ít nhất một tài khoản Quản trị viên hoạt động.",
      };
    }

    if (userId === admin.id) {
      return {
        success: false,
        error: "Không thể tự hạ quyền Administrator của chính mình.",
      };
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  await logAudit({
    userId: admin.id,
    action: "USER_ROLE_CHANGED",
    entity: "User",
    entityId: userId,
    details: { email: updated.email, previousRole: user.role, newRole },
  });

  revalidatePath("/secure-console-x7/users");
  return { success: true, data: { userId: updated.id, role: updated.role } };
}
