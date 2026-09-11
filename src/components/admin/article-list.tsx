"use client";

import * as React from "react";
import Link from "next/link";
import { ArticleStatus, CefrLevel } from "@prisma/client";
import { setArticleStatusAction, deleteArticleAction } from "@/lib/actions/admin";
import { CefrBadge } from "@/components/ui/cefr-badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Plus,
  Search,
  Edit2,
  AlignLeft,
  Trash2,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ArticleListItem {
  id: string;
  slug: string;
  titleEn: string;
  titleVi: string;
  cefrLevel: CefrLevel;
  status: ArticleStatus;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  viewsCount: number;
  readingTimeMinutes: number;
  createdAt: Date;
  categories: {
    category: {
      id: string;
      nameVi: string;
      slug: string;
    };
  }[];
  _count: {
    sentences: number;
  };
}

interface ArticleListProps {
  initialArticles: ArticleListItem[];
}

export function ArticleList({ initialArticles }: ArticleListProps) {
  const [articles, setArticles] = React.useState<ArticleListItem[]>(initialArticles);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [selectedCefr, setSelectedCefr] = React.useState<string>("ALL");

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Sync state with props
  React.useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.titleVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === "ALL" || article.status === selectedStatus;
    const matchesCefr = selectedCefr === "ALL" || article.cefrLevel === selectedCefr;

    return matchesSearch && matchesStatus && matchesCefr;
  });

  const handleStatusChange = (articleId: string, newStatus: ArticleStatus) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await setArticleStatusAction(articleId, newStatus);
      if (result.success && result.data) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, status: result.data!.status } : a))
        );
      } else {
        setErrorMessage(result.error || "Lỗi thay đổi trạng thái bài viết.");
      }
    });
  };

  const handleDelete = (article: ArticleListItem) => {
    // Check deletion policy
    if (article.status === ArticleStatus.PUBLISHED) {
      alert("Chính sách an toàn: Không thể xóa bài viết đang ở trạng thái PUBLISHED. Vui lòng chuyển sang ARCHIVED trước.");
      return;
    }

    const isArchived = article.status === ArticleStatus.ARCHIVED;
    const promptMsg = isArchived
      ? `Bài viết đang lưu trữ. Bạn có CHẮC CHẮN muốn xóa vĩnh viễn '${article.titleEn}'?`
      : `Bạn có chắc chắn muốn xóa bản nháp '${article.titleEn}'?`;

    if (!confirm(promptMsg)) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteArticleAction(article.id, isArchived);
      if (result.success) {
        setArticles((prev) => prev.filter((a) => a.id !== article.id));
      } else {
        setErrorMessage(result.error || "Lỗi xóa bài viết.");
      }
    });
  };

  const getStatusBadge = (status: ArticleStatus, scheduledAt: Date | null) => {
    if (scheduledAt && new Date(scheduledAt) > new Date() && status !== ArticleStatus.PUBLISHED) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
          <Clock className="h-3 w-3" />
          Hẹn giờ xuất bản
        </span>
      );
    }

    switch (status) {
      case ArticleStatus.PUBLISHED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Đã xuất bản
          </span>
        );
      case ArticleStatus.PENDING_REVIEW:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 border border-sky-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
            Chờ duyệt
          </span>
        );
      case ArticleStatus.ARCHIVED:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/20">
            Lưu trữ
          </span>
        );
      case ArticleStatus.DRAFT:
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700">
            Bản nháp
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-400" />
            <h1 className="text-xl font-bold text-slate-100">Quản Lý Bài Báo Song Ngữ</h1>
          </div>
          <p className="text-xs text-slate-400">
            Danh sách bài đọc, quản trị vòng đời xuất bản, câu song ngữ và gắn thẻ từ vựng CEFR.
          </p>
        </div>

        <Link href="/secure-console-x7/articles/new">
          <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
            <Plus className="h-4 w-4" />
            <span>Tạo bài viết mới</span>
          </Button>
        </Link>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề hoặc slug..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value={ArticleStatus.DRAFT}>Bản nháp (DRAFT)</option>
            <option value={ArticleStatus.PENDING_REVIEW}>Chờ duyệt (PENDING_REVIEW)</option>
            <option value={ArticleStatus.PUBLISHED}>Đã xuất bản (PUBLISHED)</option>
            <option value={ArticleStatus.ARCHIVED}>Lưu trữ (ARCHIVED)</option>
          </select>

          {/* CEFR Filter */}
          <select
            value={selectedCefr}
            onChange={(e) => setSelectedCefr(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">Tất cả CEFR</option>
            <option value={CefrLevel.A1}>A1</option>
            <option value={CefrLevel.A2}>A2</option>
            <option value={CefrLevel.B1}>B1</option>
            <option value={CefrLevel.B2}>B2</option>
            <option value={CefrLevel.C1}>C1</option>
            <option value={CefrLevel.C2}>C2</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Bài viết song ngữ</th>
                <th className="px-4 py-3">CEFR</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Chuyên mục</th>
                <th className="px-4 py-3">Số câu</th>
                <th className="px-4 py-3">Lượt xem</th>
                <th className="px-4 py-3 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Không tìm thấy bài viết nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 max-w-sm space-y-0.5">
                      <p className="font-semibold text-slate-100 line-clamp-1">{article.titleEn}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{article.titleVi}</p>
                      <p className="font-mono text-[10px] text-emerald-400/80">/{article.slug}</p>
                    </td>

                    <td className="px-4 py-3">
                      <CefrBadge level={article.cefrLevel} />
                    </td>

                    <td className="px-4 py-3 space-y-1">
                      <div>{getStatusBadge(article.status, article.scheduledAt)}</div>
                      {/* State Machine Quick Toggle */}
                      <select
                        disabled={isPending}
                        value={article.status}
                        onChange={(e) => handleStatusChange(article.id, e.target.value as ArticleStatus)}
                        className="rounded border border-slate-800 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                      >
                        <option value={ArticleStatus.DRAFT}>DRAFT</option>
                        <option value={ArticleStatus.PENDING_REVIEW}>PENDING</option>
                        <option value={ArticleStatus.PUBLISHED}>PUBLISHED</option>
                        <option value={ArticleStatus.ARCHIVED}>ARCHIVED</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {article.categories.map((c) => (
                          <span
                            key={c.category.id}
                            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
                          >
                            {c.category.nameVi}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/secure-console-x7/articles/${article.id}/sentences`}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-emerald-400 hover:bg-slate-700"
                      >
                        <AlignLeft className="h-3 w-3" />
                        <span>{article._count.sentences} câu</span>
                      </Link>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      {article.viewsCount}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/secure-console-x7/articles/${article.id}/sentences`}
                          className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                          title="Biên tập câu song ngữ"
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                          href={`/secure-console-x7/articles/${article.id}/edit`}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                          title="Sửa thông tin bài viết"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(article)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title={article.status === ArticleStatus.PUBLISHED ? "Không thể xóa bài đã xuất bản" : "Xóa bài viết"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
