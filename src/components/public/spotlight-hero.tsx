import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { PublicArticleSummary } from '@/lib/articles';
import { Clock, Calendar, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SpotlightHeroProps {
  article: PublicArticleSummary | null;
}

export function SpotlightHero({ article }: SpotlightHeroProps) {
  if (!article) {
    return null;
  }

  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(article.publishedAt))
    : '';

  return (
    <section aria-labelledby="spotlight-heading" className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg transition-all duration-300 hover:border-primary/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Left / Top Details */}
          <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between z-10">
            <div>
              {/* Badge Bar */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bài viết nổi bật</span>
                </span>
                <CefrBadge level={article.cefrLevel} showLabel={true} className="text-xs px-2 py-0.5" />
                {article.categories?.[0] && (
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {article.categories[0].category.nameVi}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 id="spotlight-heading" className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 leading-snug">
                <Link
                  href={`/articles/${article.slug}`}
                  className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  {article.titleEn}
                </Link>
              </h2>

              {/* Subtitle / Vietnamese Translation */}
              <p className="text-base text-muted-foreground font-serif italic mb-4 leading-relaxed">
                {article.titleVi}
              </p>

              {/* Excerpt */}
              {(article.excerptEn || article.excerptVi) && (
                <p className="text-sm sm:text-base text-foreground/85 line-clamp-3 mb-6 leading-relaxed">
                  {article.excerptEn || article.excerptVi}
                </p>
              )}
            </div>

            {/* Meta & CTA */}
            <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{article.readingTimeMinutes} phút đọc</span>
                </span>
                {formattedDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </span>
                )}
                {article.sourceName && (
                  <span className="text-foreground/70 hidden sm:inline font-medium">
                    Nguồn: {article.sourceName}
                  </span>
                )}
              </div>

              <Link href={`/articles/${article.slug}`}>
                <Button size="default" className="gap-2 font-medium shadow-sm group">
                  <span>Đọc bài song ngữ</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right / Bottom Visual */}
          <div className="lg:col-span-5 relative min-h-[240px] sm:min-h-[300px] lg:min-h-full overflow-hidden bg-muted">
            <Link
              href={`/articles/${article.slug}`}
              className="absolute inset-0 block"
              tabIndex={-1}
              aria-hidden="true"
            >
              {article.thumbnailUrl ? (
                <Image
                  src={article.thumbnailUrl}
                  alt={article.titleEn}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  priority={true}
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 via-muted to-secondary/15 flex items-center justify-center p-8">
                  <BookOpen className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
