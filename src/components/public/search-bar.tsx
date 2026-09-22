'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { SearchHighlight } from '@/components/search/search-highlight';
import { SearchSuggestionItem } from '@/validations/search';
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
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialQuery prop changes (e.g. back/forward navigation)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Click outside listener to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced suggestions fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsDropdownOpen(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const executeSearch = (targetQuery: string) => {
    setIsDropdownOpen(false);
    const trimmed = targetQuery.trim();

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    if (trimmed.length >= 2) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }
    // Always reset page to 1 when changing search query
    params.delete('page');

    const targetUrl = `${actionUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[selectedIndex].slug);
    } else {
      executeSearch(query);
    }
  };

  const handleSelectSuggestion = (slug: string) => {
    setIsDropdownOpen(false);
    startTransition(() => {
      router.push(`/articles/${slug}`);
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsDropdownOpen(false);
    inputRef.current?.focus();

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.delete('q');
    params.delete('page');

    const targetUrl = `${actionUrl}${params.toString() ? `?${params.toString()}` : ''}`;
    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isDropdownOpen && suggestions.length > 0) {
        setIsDropdownOpen(true);
      } else {
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="relative flex items-center w-full"
      >
        <label htmlFor="public-search-input" className="sr-only">
          Tìm kiếm bài viết
        </label>
        <div className="absolute left-3.5 flex items-center pointer-events-none text-muted-foreground">
          {isPending || isLoadingSuggestions ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          id="public-search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2 && suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Tìm kiếm bài viết"
          role="combobox"
          aria-expanded={isDropdownOpen}
          aria-autocomplete="list"
          aria-controls="autocomplete-suggestions-list"
          className="w-full pl-10 pr-20 py-2.5 bg-card/80 backdrop-blur-sm border border-border/80 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-xs"
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

      {/* Autocomplete Suggestions Dropdown */}
      {isDropdownOpen && suggestions.length > 0 && (
        <div
          id="autocomplete-suggestions-list"
          role="listbox"
          aria-live="polite"
          className="absolute z-50 left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl overflow-hidden py-1 divide-y divide-border/30 animate-in fade-in-0 zoom-in-95 duration-100"
        >

          <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Gợi ý nhanh</span>
            <span className="text-[10px] lowercase font-normal">
              ↑↓ để duyệt, Enter để mở
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {suggestions.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectSuggestion(item.slug)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted/70 text-foreground'
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-medium leading-snug line-clamp-1">
                        <SearchHighlight text={item.titleEn} query={query} />
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        <SearchHighlight text={item.titleVi} query={query} />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <CefrBadge level={item.cefrLevel} />
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-60" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
