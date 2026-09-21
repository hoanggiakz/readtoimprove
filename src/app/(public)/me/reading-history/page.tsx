import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CefrLevel } from '@prisma/client';
import { History, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { getUserReadingHistory } from '@/lib/queries/user-history';
import { HistoryItemCard } from '@/components/me/history-item-card';
import { ClearHistoryDialog } from '@/components/me/clear-history-dialog';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Lịch sử đọc bài | ReadToImprove',
  description: 'Danh sách các bài viết bạn đã đọc và theo dõi tiến độ hoàn thành.',
};

interface ReadingHistoryPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    level?: string;
  }>;
}

export default async function ReadingHistoryPage({
  searchParams,
}: ReadingHistoryPageProps) {
  const user = await requireAuth('/me/reading-history');
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const level = Object.values(CefrLevel).includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : undefined;

  const [historyResult, categories] = await Promise.all([
    getUserReadingHistory(user.id, { page, limit: 10, category, level }),
    prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      select: { id: true, slug: true, nameVi: true },
    }),
  ]);

  const { items, total, totalPages } = historyResult;

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <History className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Lịch sử đọc bài
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
              {total} bài
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Theo dõi tiến độ, đọc tiếp các bài dang dở hoặc quản lý lịch sử đọc của bạn.
          </p>
        </div>

        {total > 0 && <ClearHistoryDialog />}
      </div>

      {/* 2. FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* CEFR Level Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href={`/me/reading-history${category ? `?category=${category}` : ''}`}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              !level
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            Tất cả CEFR
          </Link>
          {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as CefrLevel[]).map((lvl) => (
            <Link
              key={lvl}
              href={`/me/reading-history?level=${lvl}${category ? `&category=${category}` : ''}`}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                level === lvl
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {lvl}
            </Link>
          ))}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:border-l sm:pl-3 border-border/60">
            <Link
              href={`/me/reading-history${level ? `?level=${level}` : ''}`}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                !category
                  ? 'bg-foreground text-background'
                  : 'bg-card border border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              Tất cả chủ đề
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/me/reading-history?category=${cat.slug}${level ? `&level=${level}` : ''}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                  category === cat.slug
                    ? 'bg-foreground text-background'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat.nameVi}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. HISTORY ITEM LIST */}
      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <HistoryItemCard key={item.id} item={item} />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Trang <strong>{page}</strong> / {totalPages} (Tổng {total} bài)
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/me/reading-history?page=${page - 1}${
                    category ? `&category=${category}` : ''
                  }${level ? `&level=${level}` : ''}`}
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    className="h-8 gap-1 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Trước</span>
                  </Button>
                </Link>

                <Link
                  href={`/me/reading-history?page=${page + 1}${
                    category ? `&category=${category}` : ''
                  }${level ? `&level=${level}` : ''}`}
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : undefined}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    className="h-8 gap-1 text-xs"
                  >
                    <span>Sau</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center space-y-4">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Chưa có bài viết nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {category || level
                ? 'Không tìm thấy bài viết nào khớp với bộ lọc đã chọn.'
                : 'Khi bạn đọc các bài báo tin tức song ngữ, lịch sử và tiến độ đọc sẽ hiển thị tại đây.'}
            </p>
          </div>
          <Link href="/articles">
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <BookOpen className="h-4 w-4" />
              <span>Khám phá bài viết mới</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
