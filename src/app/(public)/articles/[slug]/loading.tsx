import React from 'react';

export default function ArticleLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-6 w-20 bg-muted rounded-full" />
        </div>
        <div className="h-10 w-4/5 bg-muted rounded-lg" />
        <div className="h-6 w-3/5 bg-muted rounded" />
        <div className="h-8 w-full bg-muted/60 rounded" />
      </div>

      {/* Hero Thumbnail Skeleton */}
      <div className="aspect-video w-full bg-muted rounded-2xl" />

      {/* Toolbar Skeleton */}
      <div className="h-12 w-full bg-muted/80 rounded-2xl" />

      {/* Sentences Skeleton */}
      <div className="space-y-4 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-border/60 bg-card space-y-3">
            <div className="h-4 w-10 bg-muted rounded" />
            <div className="h-6 w-full bg-muted rounded" />
            <div className="h-5 w-4/5 bg-muted/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
