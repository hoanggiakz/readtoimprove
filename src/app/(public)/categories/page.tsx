import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublicCategoriesWithCounts } from '@/lib/articles';
import { Layers, ArrowRight, BookOpen } from 'lucide-react';
import { JsonLd } from '@/components/seo/json-ld';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Chủ Đề Tin Tức Song Ngữ | ReadToImprove',
  description:
    'Khám phá bài báo tiếng Anh theo các chủ đề chuyên sâu: Kinh tế, Công nghệ, Môi trường, Văn hóa, Khoa học và Đời sống.',
  alternates: {
    canonical: '/categories',
  },
};

export default async function CategoriesPage() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Trang chủ',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Chủ đề tin tức',
        item: `${baseUrl}/categories`,
      },
    ],
  };

  const categories = await getPublicCategoriesWithCounts();

  return (
    <main id="main-content" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      <JsonLd data={breadcrumbSchema} />
      {/* 1. HEADER */}

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Layers className="w-4 h-4" />
          <span>Danh Mục Chủ Đề</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Khám Phá Theo Chủ Đề Tin Tức
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Tập trung rèn luyện vốn từ vựng học thuật và đọc hiểu theo lĩnh vực chuyên môn bạn quan tâm nhất.
        </p>
      </div>

      {/* 2. CATEGORY CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const publishedCount = category._count?.articles || 0;

          return (
            <Link
              key={category.id}
              href={`/categories/${category.slug}`}
              className="group flex flex-col p-6 rounded-2xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </span>
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {publishedCount} bài viết
                </span>
              </div>

              <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                {category.nameVi}
              </h2>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-3">
                {category.nameEn}
              </p>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">
                {category.description ||
                  `Tuyển tập các bài báo quốc tế chọn lọc về chủ đề ${category.nameVi.toLowerCase()} dành cho người học tiếng Anh.`}
              </p>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between text-xs font-medium text-primary">
                <span>Xem danh sách bài viết</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

