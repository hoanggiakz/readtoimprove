import React from 'react';
import Link from 'next/link';
import {
  getSpotlightArticle,
  getPublicArticles,
  getPublicCategoriesWithCounts,
} from '@/lib/articles';
import { SpotlightHero } from '@/components/public/spotlight-hero';
import { ArticleCard } from '@/components/public/article-card';
import { CefrSelector } from '@/components/public/cefr-selector';
import { CategoryFilterBar } from '@/components/public/category-filter-bar';
import { SearchBar } from '@/components/public/search-bar';
import { EmptyState } from '@/components/public/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Newspaper } from 'lucide-react';

export const revalidate = 60; // Revalidate every minute

export default async function HomePage() {
  const [spotlightArticle, categories] = await Promise.all([
    getSpotlightArticle(),
    getPublicCategoriesWithCounts(),
  ]);

  // Fetch latest published articles, excluding the spotlight article if present
  const { articles: latestArticles } = await getPublicArticles({
    pageSize: 6,
    excludeId: spotlightArticle?.id,
  });

  return (
    <div className="flex flex-col gap-12 sm:gap-16 py-6 md:py-12">
      {/* 1. HERO DISCOVERY HEADER & SEARCH */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-medium text-primary">
            <span>Khám phá tin tức quốc tế song ngữ Anh–Việt</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Đọc Báo Song Ngữ Chuẩn CEFR
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Luyện đọc học thuật câu đối câu, tra cứu từ vựng theo cấp độ và nâng cao phản xạ tiếng Anh tự nhiên.
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto pt-2">
          <SearchBar placeholder="Tìm kiếm theo chủ đề, tiêu đề tiếng Anh hoặc tiếng Việt..." />
        </div>
      </section>

      {/* 2. SPOTLIGHT ARTICLE (FEATURED) */}
      {spotlightArticle && (
        <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SpotlightHero article={spotlightArticle} />
        </section>
      )}

      {/* 3. DISCOVERY FILTERS & LATEST ARTICLES */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filter Navigation Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xs">
          <CefrSelector />
          <CategoryFilterBar categories={categories} />
        </div>

        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <Newspaper className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Bài Viết Mới Nhất
            </h2>
          </div>
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="gap-1.5 font-medium group text-primary">
              <span>Xem tất cả bài viết</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Article Grid */}
        {latestArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : !spotlightArticle ? (
          <EmptyState
            title="Chưa có bài viết xuất bản"
            description="Hiện tại hệ thống đang cập nhật các bài báo mới nhất. Vui lòng quay lại sau ít phút."
            resetUrl="/"
            resetLabel="Tải lại trang"
          />
        ) : null}
      </section>

      {/* 4. THE GOLDEN READING LOOP (EDUCATIONAL METHODOLOGY) */}
      <section id="golden-loop" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 pt-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-widest">Phương pháp học cốt lõi</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Quy Trình Học 5 Bước (The Golden Reading Loop)
          </h2>
          <p className="mx-auto max-w-xl text-xs sm:text-sm text-muted-foreground">
            Biến mỗi bài báo quốc tế thành một buổi học đọc hiểu và tích lũy từ vựng học thuật toàn diện.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              01
            </div>
            <h3 className="font-semibold text-foreground text-sm">Câu Tiếng Anh Gốc</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tiếp cận câu văn báo chí chuẩn ngữ pháp từ các nguồn tin tức quốc tế uy tín.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              02
            </div>
            <h3 className="font-semibold text-foreground text-sm">Bản Dịch Đối Chiếu</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Bản dịch tiếng Việt trau chuốt, bám sát ngữ cảnh, hỗ trợ kiểm tra đối chiếu ngay lập tức.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              03
            </div>
            <h3 className="font-semibold text-foreground text-sm">Highlight Từ Vựng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gạch chân từ vựng trọng tâm với mã màu chuẩn phân cấp độ CEFR từ B1 đến C2.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              04
            </div>
            <h3 className="font-semibold text-foreground text-sm">Tooltip Giải Nghĩa</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hiện phiên âm IPA, từ loại, nghĩa tiếng Việt chính xác và ví dụ bổ sung chỉ bằng 1 thao tác click.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              05
            </div>
            <h3 className="font-semibold text-foreground text-sm">Word Bank Cá Nhân</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lưu từ mới vào sổ tay học tập, theo dõi tiến độ ghi nhớ và lịch sử đọc bài.
            </p>
          </div>
        </div>
      </section>

      {/* 5. CEFR OVERVIEW CARDS */}
      <section id="cefr" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-muted/20 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Phân Loại Cấp Độ CEFR Quốc Tế</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Lựa chọn bài viết phù hợp với trình độ hiện tại và mục tiêu nâng band điểm IELTS / TOEFL của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/articles?level=B1"
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/30 space-y-1.5 hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Badge variant="b1">B1 — Intermediate</Badge>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">IELTS 4.5 – 5.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Từ vựng và cấu trúc câu quen thuộc trong đời sống, công việc và học tập hằng ngày.
              </p>
            </Link>

            <Link
              href="/articles?level=B2"
              className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800 dark:bg-sky-950/30 space-y-1.5 hover:border-sky-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Badge variant="b2">B2 — Upper Intermediate</Badge>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">IELTS 5.5 – 6.5</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bài viết chuyên sâu về kinh tế, công nghệ với vốn từ học thuật phong phú.
              </p>
            </Link>

            <Link
              href="/articles?level=C1"
              className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-800 dark:bg-purple-950/30 space-y-1.5 hover:border-purple-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Badge variant="c1">C1 — Advanced</Badge>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">IELTS 7.0 – 8.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Văn phong bình luận phức tạp, thuật ngữ chuyên ngành và sắc thái ẩn ý cao cấp.
              </p>
            </Link>

            <Link
              href="/articles?level=C2"
              className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-800 dark:bg-rose-950/30 space-y-1.5 hover:border-rose-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <Badge variant="c2">C2 — Proficiency</Badge>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">IELTS 8.5 – 9.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Độ chính xác và tinh tế tương đương người bản xứ với vốn từ vựng học thuật đỉnh cao.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
