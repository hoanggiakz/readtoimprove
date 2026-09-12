import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface CategoryItem {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  _count?: {
    articles: number;
  };
}

interface CategoryFilterBarProps {
  categories: CategoryItem[];
  activeSlug?: string;
  baseUrl?: string;
  className?: string;
}

export function CategoryFilterBar({
  categories,
  activeSlug,
  baseUrl = '/articles',
  className,
}: CategoryFilterBarProps) {
  // Only show categories that have at least 1 published article (or show all if all have counts)
  const displayCategories = categories.filter(
    (c) => c._count === undefined || c._count.articles > 0
  );

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Layers className="w-4 h-4 text-primary" />
        <span>Chủ đề tin tức</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* All / Tất cả */}
        <Link
          href={baseUrl}
          className={cn(
            'whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
            !activeSlug
              ? 'bg-foreground text-background border-foreground font-semibold shadow-sm'
              : 'bg-card text-foreground/80 border-border/80 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          Tất cả
        </Link>

        {displayCategories.map((category) => {
          const isActive = activeSlug === category.slug;
          const count = category._count?.articles;

          return (
            <Link
              key={category.id}
              href={`${baseUrl}?category=${category.slug}`}
              className={cn(
                'whitespace-nowrap flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-sm'
                  : 'bg-card text-foreground/80 border-border/80 hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span>{category.nameVi}</span>
              {count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded-full font-mono',
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
