import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublicArticleBySlug } from '@/lib/articles';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { ReadingProgressBar } from '@/components/reader/reading-progress-bar';
import { BilingualSentenceList } from '@/components/reader/bilingual-sentence-list';
import { SentenceDTO } from '@/components/reader/bilingual-sentence-item';
import {
  Clock,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Không tìm thấy bài viết | ReadToImprove',
    };
  }

  const title = article.metaTitle || `${article.titleEn} | Đọc Báo Song Ngữ | ReadToImprove`;
  const description =
    article.metaDescription ||
    article.excerptEn ||
    article.excerptVi ||
    'Đọc báo song ngữ Anh–Việt câu đối câu chuẩn CEFR tại ReadToImprove.';

  return {
    title,
    description,
    alternates: {
      canonical: article.canonicalUrl || `/articles/${article.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/articles/${article.slug}`,
      type: 'article',
      publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      images: article.thumbnailUrl ? [{ url: article.thumbnailUrl }] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const article = await getPublicArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(article.publishedAt))
    : '';

  // Transform Prisma models into clean serializable reader DTOs
  const sentencesDTO: SentenceDTO[] = article.sentences.map((s) => ({
    id: s.id,
    orderIndex: s.orderIndex,
    textEn: s.textEn,
    textVi: s.textVi,
    vocabularies: s.vocabularies.map((sv) => ({
      id: sv.id,
      startOffset: sv.startOffset,
      endOffset: sv.endOffset,
      highlightedText: sv.highlightedText,
      vocabulary: sv.vocabulary
        ? {
            id: sv.vocabulary.id,
            word: sv.vocabulary.word,
            normalizedLemma: sv.vocabulary.normalizedLemma,
            ipa: sv.vocabulary.ipa,
            pos: sv.vocabulary.pos,
            meaningVi: sv.vocabulary.meaningVi,
            exampleEn: sv.vocabulary.exampleEn,
            exampleVi: sv.vocabulary.exampleVi,
            cefrLevel: sv.vocabulary.cefrLevel,
            audioUrl: sv.vocabulary.audioUrl,
          }
        : null,
    })),
  }));

  // JSON-LD Structured Data for NewsArticle
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titleEn,
    description: article.excerptEn || article.excerptVi,
    datePublished: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
    image: article.thumbnailUrl || undefined,
    author: {
      '@type': 'Organization',
      name: article.sourceName || 'ReadToImprove',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ReadToImprove',
    },
  };

  return (
    <>
      {/* Scroll Reading Progress Bar */}
      <ReadingProgressBar />

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 md:py-10 space-y-8">
        {/* 1. TOP BREADCRUMB & BACK LINK */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Thư viện bài viết</span>
          </Link>
          <span>/</span>
          {article.categories?.[0] && (
            <>
              <Link
                href={`/articles?category=${article.categories[0].category.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {article.categories[0].category.nameVi}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="truncate max-w-[200px] text-foreground/70 font-medium">
            {article.titleEn}
          </span>
        </nav>

        {/* 2. ARTICLE HEADER */}
        <header className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <CefrBadge level={article.cefrLevel} showLabel={true} className="text-xs px-2.5 py-1" />
            {article.categories.map(({ category }) => (
              <Link
                key={category.id}
                href={`/articles?category=${category.slug}`}
                className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {category.nameVi}
              </Link>
            ))}
          </div>

          {/* English Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-[1.2]">
            {article.titleEn}
          </h1>

          {/* Vietnamese Title */}
          <p className="text-base sm:text-lg text-muted-foreground font-serif italic leading-relaxed">
            {article.titleVi}
          </p>

          {/* Meta details bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-b border-border/60 py-3 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{article.readingTimeMinutes} phút đọc</span>
              </span>
              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formattedDate}</span>
                </span>
              )}
              <span className="hidden sm:inline">
                {sentencesDTO.length} câu đối chiếu song ngữ
              </span>
            </div>

            {/* External Source Attribution */}
            {article.sourceName && (
              <div className="flex items-center gap-1.5 text-xs">
                <span>Nguồn gốc:</span>
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  <span>{article.sourceName}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </header>

        {/* 3. HERO THUMBNAIL */}
        {article.thumbnailUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 shadow-md">
            <Image
              src={article.thumbnailUrl}
              alt={article.titleEn}
              fill
              sizes="(max-width: 896px) 100vw, 896px"
              priority={true}
              className="object-cover"
            />
          </div>
        )}

        {/* 4. EXCERPT */}
        {(article.excerptEn || article.excerptVi) && (
          <div className="p-5 sm:p-6 rounded-2xl bg-primary/5 border border-primary/15 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">Tóm tắt bài báo</h2>
            {article.excerptEn && (
              <p className="text-sm sm:text-base font-medium text-foreground leading-relaxed">
                {article.excerptEn}
              </p>
            )}
            {article.excerptVi && (
              <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed border-t border-primary/10 pt-2">
                {article.excerptVi}
              </p>
            )}
          </div>
        )}

        {/* 5. INTERACTIVE BILINGUAL READING EXPERIENCE */}
        <main id="article-reader-content" className="space-y-6 pt-2">
          <BilingualSentenceList sentences={sentencesDTO} />
        </main>

        {/* 6. EDUCATIONAL FAIR USE NOTICE & FOOTER ATTRIBUTION */}
        <footer className="pt-8 border-t border-border/60 space-y-4">
          <div className="p-4 rounded-xl border border-border/60 bg-muted/30 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>
              Bản tin này được biên soạn và phân tích phục vụ mục đích học thuật theo nguyên tắc giáo dục hợp lý (Educational Fair Use). Bản quyền nội dung gốc thuộc về {article.sourceName || 'tác giả nguyên bản'}.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Link href="/articles">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại danh sách bài viết</span>
              </Button>
            </Link>

            {article.sourceUrl && (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>Đọc bài gốc tại {article.sourceName}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </footer>
      </article>
    </>
  );
}
