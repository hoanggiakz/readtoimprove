import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { CefrLevel } from '@prisma/client';
import { Heart, BookOpen, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireAuth } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { getUserFavorites } from '@/lib/queries/user-history';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { FavoriteButton } from '@/components/public/favorite-button';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Bài viết đã lưu | ReadToImprove',
  description: 'Bộ sưu tập các bài báo tin tức song ngữ Anh–Việt bạn đã yêu thích.',
};

interface FavoritesPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    level?: string;
  }>;
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const user = await requireAuth('/me/favorites');
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const category = params.category;
  const level = Object.values(CefrLevel).includes(params.level as CefrLevel)
    ? (params.level as CefrLevel)
    : undefined;

  const [favoritesResult, categories] = await Promise.all([
    getUserFavorites(user.id, { page, limit: 12, category, level }),
    prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
      select: { id: true, slug: true, nameVi: true },
    }),
  ]);

  const { items, total, totalPages } = favoritesResult;

  return (
    <div className="space-y-6">
      {/* 1. HEADER */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
            <Heart className="h-4 w-4 fill-rose-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Bài viết đã lưu
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
            {total} bài
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Danh sách các bài viết bạn đã đánh dấu để đọc lại hoặc lưu trữ ôn luyện.
        </p>
      </div>

      {/* 2. FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* CEFR Level Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Link
            href={`/me/favorites${category ? `?category=${category}` : ''}`}
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
              href={`/me/favorites?level=${lvl}${category ? `&category=${category}` : ''}`}
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
              href={`/me/favorites${level ? `?level=${level}` : ''}`}
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
                href={`/me/favorites?category=${cat.slug}${level ? `&level=${level}` : ''}`}
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

      {/* 3. FAVORITES GRID */}
      {items.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(({ id, article }) => (
              <div
                key={id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Thumbnail & Favorite Action */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
                    {article.thumbnailUrl ? (
                      <Image
                        src={article.thumbnailUrl}
                        alt={article.titleEn}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted/60 text-muted-foreground">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5">
                      <FavoriteButton
                        articleId={article.id}
                        initialFavorited={true}
                        isLoggedIn={true}
                        className="shadow-md bg-background/90"
                      />
                    </div>
                  </div>

                  {/* Badges & Meta */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <CefrBadge level={article.cefrLevel} showLabel={false} className="text-[10px] px-2 py-0.5" />
                      {article.categories?.[0] && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          {article.categories[0].category.nameVi}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{article.readingTimeMinutes} phút</span>
                    </span>
                  </div>

                  {/* Title Link */}
                  <Link href={`/articles/${article.slug}`} className="block group-hover:text-primary transition-colors">
                    <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-snug">
                      {article.titleEn}
                    </h3>
                    <p className="mt-1 font-serif italic text-xs text-muted-foreground line-clamp-2">
                      {article.titleVi}
                    </p>
                  </Link>
                </div>

                <div className="pt-4 border-t border-border/60 mt-4">
                  <Link href={`/articles/${article.slug}`} className="w-full">
                    <Button size="sm" variant="outline" className="w-full text-xs font-semibold gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Đọc bài viết</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border/60">
              <span className="text-xs text-muted-foreground">
                Trang <strong>{page}</strong> / {totalPages} (Tổng {total} bài)
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/me/favorites?page=${page - 1}${
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
                  href={`/me/favorites?page=${page + 1}${
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
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <Heart className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Chưa có bài viết yêu thích nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {category || level
                ? 'Không tìm thấy bài viết nào khớp với bộ lọc đã chọn.'
                : 'Nhấn vào biểu tượng trái tim khi đọc bài để lưu các bài viết tâm đắc vào bộ sưu tập này.'}
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
