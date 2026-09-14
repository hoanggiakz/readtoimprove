import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getPublicArticles,
  getPublicCategoriesWithCounts,
} from '@/lib/articles';
import { publicArticlesQuerySchema } from '@/validations/public';
import { ArticleCard } from '@/components/public/article-card';
import { CefrSelector } from '@/components/public/cefr-selector';
import { CategoryFilterBar } from '@/components/public/category-filter-bar';
import { SearchBar } from '@/components/public/search-bar';
import { Pagination } from '@/components/public/pagination';
import { EmptyState } from '@/components/public/empty-state';
import { BookOpen, Filter, X } from 'lucide-react';

export const revalidate = 60;

interface ArticlesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    level?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ArticlesPageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const parsed = publicArticlesQuerySchema.safeParse(resolvedParams);
  const q = parsed.success ? parsed.data.q : undefined;
  const level = parsed.success ? parsed.data.level : undefined;

  let title = 'Kho Bài Báo Song Ngữ Anh–Việt | ReadToImprove';
  if (q) {
    title = `Tìm kiếm: "${q}" | ReadToImprove`;
  } else if (level) {
    title = `Bài viết cấp độ CEFR ${level} | ReadToImprove`;
  }

  return {
    title,
    description:
      'Khám phá hàng trăm bài báo quốc tế chọn lọc được dịch đối chiếu song ngữ Anh–Việt và gắn thẻ từ vựng theo khung CEFR chuẩn châu Âu.',
    alternates: {
      canonical: '/articles',
    },
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const resolvedParams = await searchParams;
  const parsed = publicArticlesQuerySchema.safeParse(resolvedParams);

  const queryData = parsed.success
    ? parsed.data
    : { q: undefined, category: undefined, level: undefined, page: 1 };

  const [categories, { articles, totalCount, totalPages, currentPage }] =
    await Promise.all([
      getPublicCategoriesWithCounts(),
      getPublicArticles({
        page: queryData.page,
        categorySlug: queryData.category,
        cefrLevel: queryData.level,
        searchQuery: queryData.q,
      }),
    ]);

  const activeCategory = categories.find((c) => c.slug === queryData.category);
  const hasActiveFilters = Boolean(
    queryData.q || queryData.category || queryData.level
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* 1. PAGE HEADER */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <BookOpen className="w-4 h-4" />
          <span>Thư Viện Bài Báo Song Ngữ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          {activeCategory
            ? `Chủ đề: ${activeCategory.nameVi}`
            : queryData.level
            ? `Trình độ CEFR ${queryData.level}`
            : queryData.q
            ? `Kết quả tìm kiếm: "${queryData.q}"`
            : 'Tất Cả Bài Viết'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Đọc đối chiếu từng câu song ngữ, tra cứu từ vựng học thuật theo chuẩn CEFR từ các nguồn báo quốc tế uy tín.
        </p>
      </div>

      {/* 2. SEARCH & FILTERS BAR */}
      <div className="space-y-5 p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs">
        {/* Search Input */}
        <SearchBar
          initialQuery={queryData.q || ''}
          placeholder="Tìm kiếm tiêu đề hoặc nội dung..."
        />

        {/* Filter Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border/50">
          <CefrSelector currentLevel={queryData.level} baseUrl="/articles" />
          <CategoryFilterBar
            categories={categories}
            activeSlug={queryData.category}
            baseUrl="/articles"
          />
        </div>

        {/* Active Filters Summary Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/50 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Đang lọc theo:
            </span>

            {queryData.q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
                Từ khóa: &ldquo;{queryData.q}&rdquo;
              </span>
            )}

            {queryData.level && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800 font-medium">
                CEFR: {queryData.level}
              </span>
            )}

            {activeCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-foreground border border-border font-medium">
                Chủ đề: {activeCategory.nameVi}
              </span>
            )}

            <Link
              href="/articles"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa tất cả bộ lọc</span>
            </Link>
          </div>
        )}
      </div>

      {/* 3. RESULTS STATUS & GRID */}
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
              <ArticleCard
                key={article.id}
                article={article}
                searchQuery={queryData.q}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Không tìm thấy bài viết phù hợp"
            description={
              queryData.q
                ? `Không có bài viết nào khớp với từ khóa "${queryData.q}". Vui lòng thử từ khóa ngắn hơn, chuyển sang tiếng Anh/tiếng Việt hoặc xóa bớt bộ lọc.`
                : hasActiveFilters
                  ? 'Không có bài viết nào khớp với tiêu chí bộ lọc hiện tại của bạn. Vui lòng chọn tiêu chí khác hoặc xóa bộ lọc.'
                  : 'Hiện chưa có bài viết nào được xuất bản trong mục này.'
            }
            resetUrl="/articles"
            resetLabel="Xóa tất cả bộ lọc"
          />
        )}

        {/* 4. PAGINATION */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          baseUrl="/articles"
          searchParams={{
            q: queryData.q,
            category: queryData.category,
            level: queryData.level,
          }}
        />
      </div>
    </div>
  );
}
