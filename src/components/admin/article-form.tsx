"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArticleStatus, CefrLevel } from "@prisma/client";
import { createArticleAction, updateArticleAction, ActionResult } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Sparkles, Save, ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CategoryOption {
  id: string;
  nameVi: string;
  nameEn: string;
}

interface ArticleFormProps {
  initialData?: {
    id: string;
    slug: string;
    titleEn: string;
    titleVi: string;
    excerptEn: string | null;
    excerptVi: string | null;
    sourceName: string;
    sourceUrl: string;
    originalPublishedAt: Date | null;
    thumbnailUrl: string | null;
    videoUrl: string | null;
    cefrLevel: CefrLevel;
    status: ArticleStatus;
    scheduledAt: Date | null;
    readingTimeMinutes: number;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    ogImage: string | null;
    categories: { categoryId: string }[];
  };
  categories: CategoryOption[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArticleForm({ initialData, categories }: ArticleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialData);

  const [titleEn, setTitleEn] = React.useState(initialData?.titleEn || "");
  const [titleVi, setTitleVi] = React.useState(initialData?.titleVi || "");
  const [slug, setSlug] = React.useState(initialData?.slug || "");
  const [excerptEn, setExcerptEn] = React.useState(initialData?.excerptEn || "");
  const [excerptVi, setExcerptVi] = React.useState(initialData?.excerptVi || "");
  const [sourceName, setSourceName] = React.useState(initialData?.sourceName || "");
  const [sourceUrl, setSourceUrl] = React.useState(initialData?.sourceUrl || "");
  const [thumbnailUrl, setThumbnailUrl] = React.useState(initialData?.thumbnailUrl || "");
  const [videoUrl, setVideoUrl] = React.useState(initialData?.videoUrl || "");
  const [cefrLevel, setCefrLevel] = React.useState<CefrLevel>(initialData?.cefrLevel || CefrLevel.B2);
  const [status, setStatus] = React.useState<ArticleStatus>(initialData?.status || ArticleStatus.DRAFT);
  const [scheduledAt, setScheduledAt] = React.useState(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [readingTimeMinutes, setReadingTimeMinutes] = React.useState(initialData?.readingTimeMinutes || 3);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>(
    initialData?.categories.map((c) => c.categoryId) || []
  );

  // SEO Fields
  const [metaTitle, setMetaTitle] = React.useState(initialData?.metaTitle || "");
  const [metaDescription, setMetaDescription] = React.useState(initialData?.metaDescription || "");
  const [canonicalUrl, setCanonicalUrl] = React.useState(initialData?.canonicalUrl || "");
  const [ogImage, setOgImage] = React.useState(initialData?.ogImage || "");

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const handleGenerateSlug = () => {
    if (titleEn) {
      setSlug(slugify(titleEn));
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const payload = {
      slug,
      titleEn,
      titleVi,
      excerptEn: excerptEn || null,
      excerptVi: excerptVi || null,
      sourceName,
      sourceUrl,
      thumbnailUrl: thumbnailUrl || null,
      videoUrl: videoUrl || null,
      cefrLevel,
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      readingTimeMinutes: Number(readingTimeMinutes),
      categoryIds: selectedCategoryIds,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      ogImage: ogImage || null,
    };

    startTransition(async () => {
      let result: ActionResult<{ id: string; slug: string }>;

      if (isEdit && initialData) {
        result = await updateArticleAction(initialData.id, payload);
      } else {
        result = await createArticleAction(payload);
      }

      if (result.success && result.data) {
        router.push("/secure-console-x7/articles");
      } else {
        setErrorMessage(result.error || "Có lỗi xảy ra khi lưu bài viết.");
        if (result.errors) {
          setFieldErrors(result.errors);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/secure-console-x7/articles"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách bài viết</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/secure-console-x7/articles">
            <Button type="button" variant="outline" size="sm" className="border-slate-700 text-slate-300">
              Hủy
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            <Save className="h-4 w-4" />
            <span>{isPending ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo bài viết"}</span>
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Core Bilingual Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          1. Tiêu Đề & Đường Dẫn Song Ngữ
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tiêu đề tiếng Anh (English Title) *
            </label>
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              required
              placeholder="e.g. Breakthrough in Renewable Energy Research"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {fieldErrors.titleEn && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.titleEn[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Tiêu đề tiếng Việt (Vietnamese Title) *
            </label>
            <input
              type="text"
              value={titleVi}
              onChange={(e) => setTitleVi(e.target.value)}
              required
              placeholder="e.g. Bước đột phá mới trong nghiên cứu năng lượng tái tạo"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {fieldErrors.titleVi && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.titleVi[0]}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Đường dẫn thân thiện (Slug) *</label>
              <button
                type="button"
                onClick={handleGenerateSlug}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3" />
                Tự tạo từ tiêu đề tiếng Anh
              </button>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              placeholder="e.g. breakthrough-in-renewable-energy"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm font-mono text-emerald-400 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {fieldErrors.slug && (
              <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.slug[0]}</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Excerpts & Attribution */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          2. Tóm Tắt & Nguồn Tin (Educational Attribution)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tóm tắt tiếng Anh (Excerpt EN)</label>
            <textarea
              rows={3}
              value={excerptEn}
              onChange={(e) => setExcerptEn(e.target.value)}
              placeholder="Short introductory summary in English..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tóm tắt tiếng Việt (Excerpt VI)</label>
            <textarea
              rows={3}
              value={excerptVi}
              onChange={(e) => setExcerptVi(e.target.value)}
              placeholder="Tóm tắt ngắn gọn bằng tiếng Việt..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tên nguồn tin gốc (Source Name) *</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              required
              placeholder="e.g. ReadToImprove Newsroom / Educational Wire"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">URL nguồn tin gốc (Source URL) *</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
              placeholder="https://example.com/original-article"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Classification & Publication */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          3. Phân Loại CEFR & Trạng Thái Xuất Bản
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cấp độ CEFR *</label>
            <select
              value={cefrLevel}
              onChange={(e) => setCefrLevel(e.target.value as CefrLevel)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value={CefrLevel.A1}>A1 — Sơ cấp cơ bản</option>
              <option value={CefrLevel.A2}>A2 — Sơ cấp</option>
              <option value={CefrLevel.B1}>B1 — Trung cấp</option>
              <option value={CefrLevel.B2}>B2 — Trung cấp trên</option>
              <option value={CefrLevel.C1}>C1 — Cao cấp</option>
              <option value={CefrLevel.C2}>C2 — Tinh thông</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Trạng thái bài viết *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value={ArticleStatus.DRAFT}>Bản nháp (DRAFT)</option>
              <option value={ArticleStatus.PENDING_REVIEW}>Chờ duyệt (PENDING_REVIEW)</option>
              <option value={ArticleStatus.PUBLISHED}>Đã xuất bản (PUBLISHED)</option>
              <option value={ArticleStatus.ARCHIVED}>Lưu trữ (ARCHIVED)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Thời gian đọc ước tính (Phút)</label>
            <input
              type="number"
              min={1}
              max={60}
              value={readingTimeMinutes}
              onChange={(e) => setReadingTimeMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Scheduled Publishing */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Hẹn giờ xuất bản tự động (Scheduled At - Tùy chọn)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Nếu đặt lịch, bài viết sẽ tự động chuyển sang trạng thái PUBLISHED khi đến thời điểm này.
          </p>
        </div>

        {/* Categories Multi-Select */}
        <div className="pt-2">
          <label className="block text-xs font-medium text-slate-300 mb-2">Chuyên mục (Categories)</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {cat.nameVi} ({cat.nameEn})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Media & SEO Metadata */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
          4. Hình Ảnh & Tối Ưu Hóa Tìm Kiếm (SEO)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">URL Hình ảnh thu nhỏ (Thumbnail)</label>
            <input
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">URL Video kèm theo (Nếu có)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Title (SEO)</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
              placeholder="Tối đa 70 ký tự"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Meta Description (SEO)</label>
            <textarea
              rows={2}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={160}
              placeholder="Tối đa 160 ký tự"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Canonical URL (Nếu có)</label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://example.com/canonical"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">OG Image URL (Ảnh mạng xã hội)</label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://example.com/og-image.jpg"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Submit Actions */}
      <div className="flex justify-end gap-3">
        <Link href="/secure-console-x7/articles">
          <Button type="button" variant="outline" className="border-slate-700 text-slate-300">
            Hủy bỏ
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={isPending}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          <Save className="h-4 w-4" />
          <span>{isPending ? "Đang lưu..." : isEdit ? "Cập nhật bài viết" : "Hoàn tất & Tạo bài viết"}</span>
        </Button>
      </div>
    </form>
  );
}
