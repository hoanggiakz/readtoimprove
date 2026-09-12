import React from 'react';

export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="aspect-video w-full bg-muted/80" />

      {/* Content Skeleton */}
      <div className="p-5 flex flex-col flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-5 w-4/5 bg-muted rounded" />
        <div className="h-4 w-3/5 bg-muted rounded" />
        <div className="h-12 w-full bg-muted/60 rounded" />
        <div className="pt-3 border-t border-border/40 flex justify-between">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function ArticleGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}
