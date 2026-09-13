import React from 'react';

export default function WordBankLoading() {
  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4 pb-6 border-b border-border/60">
        <div className="h-4 w-36 bg-muted rounded-md" />
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-muted rounded-lg" />
          <div className="h-8 w-56 bg-muted rounded-md" />
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-96 bg-muted rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="h-10 w-full sm:w-80 bg-muted rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-14 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Card Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border/60 bg-card/60 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-6 w-28 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
              <div className="h-5 w-10 bg-muted rounded-full" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
            <div className="p-3 rounded-xl bg-muted/40 space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3.5 w-full bg-muted rounded" />
            </div>
            <div className="pt-3 border-t border-border/40 flex justify-between">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
