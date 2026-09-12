'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  actionUrl?: string;
  className?: string;
}

export function SearchBar({
  initialQuery = '',
  placeholder = 'Tìm kiếm tiêu đề hoặc nội dung bài viết...',
  actionUrl = '/articles',
  className,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (trimmed.length >= 2) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    // Always reset page to 1 when changing search
    params.delete('page');

    const targetUrl = `${actionUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const handleClear = () => {
    setQuery('');
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.delete('q');
    params.delete('page');

    const targetUrl = `${actionUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      className={cn('relative flex items-center w-full', className)}
    >
      <label htmlFor="public-search-input" className="sr-only">
        Tìm kiếm bài viết
      </label>
      <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>

      <input
        id="public-search-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Tìm kiếm bài viết"
        className="w-full pl-10 pr-20 py-2.5 bg-card/80 backdrop-blur-sm border border-border/80 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
      />

      <div className="absolute right-2.5 flex items-center gap-1.5">
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Xóa từ khóa"
            aria-label="Xóa từ khóa tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="submit"
          className="text-xs font-medium px-2.5 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
        >
          Tìm
        </button>
      </div>
    </form>
  );
}
