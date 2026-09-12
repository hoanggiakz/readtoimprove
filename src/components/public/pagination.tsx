import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const buildPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== 'page') {
        params.set(key, value);
      }
    });

    if (pageNumber > 1) {
      params.set('page', pageNumber.toString());
    }

    const query = params.toString();
    return query ? `${baseUrl}?${query}` : baseUrl;
  };

  // Generate page numbers to show (e.g. 1, 2, 3 ... total)
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 2; // how many pages around current page

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push('ellipsis');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      aria-label="Phân trang danh sách bài viết"
      className={cn('flex items-center justify-center gap-1.5 py-6', className)}
    >
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          href={buildPageUrl(currentPage - 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-card hover:bg-muted/70 hover:border-primary/50 transition-colors"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 text-muted-foreground/40 cursor-not-allowed bg-muted/20"
          aria-disabled="true"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1 text-xs text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isCurrent = p === currentPage;

          return (
            <Link
              key={p}
              href={buildPageUrl(p)}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border',
                isCurrent
                  ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                  : 'bg-card border-border/80 hover:bg-muted/70 hover:border-primary/50 text-foreground'
              )}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          href={buildPageUrl(currentPage + 1)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/80 bg-card hover:bg-muted/70 hover:border-primary/50 transition-colors"
          aria-label="Trang tiếp theo"
        >
          <span className="hidden sm:inline">Tiếp</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border/40 text-muted-foreground/40 cursor-not-allowed bg-muted/20"
          aria-disabled="true"
        >
          <span className="hidden sm:inline">Tiếp</span>
          <ChevronRight className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
