import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getPublicArticles } from '@/lib/articles';
import { ArticleCard } from '@/components/public/article-card';
import { Pagination } from '@/components/public/pagination';
import { EmptyState } from '@/components/public/empty-state';
import { ChevronLeft, Layers } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: 'Không tìm thấy chủ đề | ReadToImprove',
    };
  }

  return {
    title: `Chủ đề: ${category.nameVi} (${category.nameEn}) | ReadToImprove`,
    description:
      category.description ||
      `Đọc bài báo song ngữ Anh–Việt chủ đề ${category.nameVi} theo chuẩn CEFR tại ReadToImprove.`,
    alternates: {
      canonical: `/categories/${category.slug}`,
    },
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, parseInt(resolvedSearchParams.page || '1', 10) || 1);

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const { articles, totalCount, totalPages } = await getPublicArticles({
    categorySlug: slug,
    page: currentPage,
    pageSize: 12,
  });

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* 1. BREADCRUMBS */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Tất cả chủ đề</span>
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{category.nameVi}</span>
      </nav>

      {/* 2. CATEGORY HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Layers className="w-4 h-4" />
          <span>Chuyên mục tin tức</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {category.nameVi}
          </h1>
          <span className="text-base sm:text-lg text-muted-foreground font-mono">
            / {category.nameEn}
          </span>
        </div>
        {category.description && (
          <p className="text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* 3. ARTICLES GRID & PAGINATION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground border-b border-border/60 pb-3">
          <span>
            Hiển thị <strong className="text-foreground">{articles.length}</strong> trên tổng số{' '}
            <strong className="text-foreground">{totalCount}</strong> bài viết
          </span>
          {totalPages > 1 && (
            <span>
              Trang <strong className="text-foreground">{currentPage}</strong> /{' '}
              <strong className="text-foreground">{totalPages}</strong>
            </span>
          )}
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Chưa có bài viết cho chủ đề này"
            description="Hiện chưa có bài báo nào thuộc chủ đề này được xuất bản. Vui lòng khám phá các chủ đề khác."
            resetUrl="/categories"
            resetLabel="Xem các chủ đề khác"
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl={`/categories/${category.slug}`}
        />
      </div>
    </div>
  );
}
