import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { PublicArticleSummary } from '@/lib/articles';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { SearchHighlight } from '@/components/search/search-highlight';

interface ArticleCardProps {
  article: PublicArticleSummary;
  priority?: boolean;
  searchQuery?: string;
}

export function ArticleCard({ article, priority = false, searchQuery }: ArticleCardProps) {
  const formattedDate = article.publishedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(article.publishedAt))
    : '';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Thumbnail */}
      <Link
        href={`/articles/${article.slug}`}
        className="relative aspect-video w-full overflow-hidden bg-muted block"
        tabIndex={-1}
        aria-hidden="true"
      >
        {article.thumbnailUrl ? (
          <Image
            src={article.thumbnailUrl}
            alt={article.titleEn}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-muted to-secondary/10 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Top Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <CefrBadge level={article.cefrLevel} showLabel={false} className="shadow-sm" />
          {article.categories?.[0] && (
            <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/90 backdrop-blur-sm text-foreground border border-border/50 shadow-sm">
              {article.categories[0].category.nameVi}
            </span>
          )}
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5">
        {/* Categories if more than one */}
        {article.categories && article.categories.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {article.categories.slice(1, 3).map(({ category }) => (
              <span
                key={category.id}
                className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded"
              >
                {category.nameVi}
              </span>
            ))}
          </div>
        )}

        {/* English Title */}
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
          <Link
            href={`/articles/${article.slug}`}
            className="focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            <SearchHighlight text={article.titleEn} query={searchQuery} />
          </Link>
        </h3>

        {/* Vietnamese Title Subtitle */}
        <p className="text-xs text-muted-foreground line-clamp-1 italic mb-3 font-serif">
          <SearchHighlight text={article.titleVi} query={searchQuery} />
        </p>

        {/* Excerpt */}
        {(article.excerptEn || article.excerptVi) && (
          <p className="text-sm text-foreground/80 line-clamp-2 mb-4 flex-1">
            <SearchHighlight
              text={article.excerptEn || article.excerptVi || ''}
              query={searchQuery}
            />
          </p>
        )}

        {/* Footer Meta */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readingTimeMinutes} phút đọc</span>
            </span>
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </span>
            )}
          </div>

          {article.sourceName && (
            <span
              className="text-[11px] truncate max-w-[120px] font-medium text-foreground/70"
              title={`Nguồn: ${article.sourceName}`}
            >
              {article.sourceName}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
