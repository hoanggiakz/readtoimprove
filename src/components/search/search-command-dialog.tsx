'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { SearchHighlight } from '@/components/search/search-highlight';
import { SearchSuggestionItem } from '@/validations/search';
import { cn } from '@/lib/utils';

export function SearchCommandDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [, startTransition] = useTransition();

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(-1);
    } else {
      setQuery('');
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Debounced autocomplete suggestions fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = (slug: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.push(`/articles/${slug}`);
    });
  };

  const handleFullSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    setIsOpen(false);
    startTransition(() => {
      if (trimmed.length > 0) {
        router.push(`/articles?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.push('/articles');
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex].slug);
      } else {
        handleFullSearch(query);
      }
    }
  };

  return (
    <>
      {/* 1. Trigger Buttons */}
      {/* Desktop Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 h-9 px-3 text-xs text-muted-foreground bg-muted/50 hover:bg-muted border rounded-md transition-colors w-48 lg:w-64 justify-between"
        aria-label="Tìm kiếm bài viết (Ctrl+K)"
        title="Tìm kiếm bài viết (Ctrl+K)"
      >
        <div className="flex items-center gap-2 truncate">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="truncate">Tìm kiếm bài viết...</span>
        </div>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground bg-background border rounded shadow-xs select-none">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Mobile Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground rounded-md transition-colors"
        aria-label="Mở tìm kiếm"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* 2. Command Dialog Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tìm kiếm bài viết song ngữ"
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-xl bg-card border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all animate-in zoom-in-95 duration-150"
          >
            {/* Input Header */}
            <div className="relative flex items-center border-b px-4 py-3 gap-3 bg-muted/20">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập từ khóa tiếng Anh hoặc tiếng Việt..."
                className="w-full bg-transparent text-sm sm:text-base text-foreground placeholder:text-muted-foreground outline-hidden"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-autocomplete="list"
                aria-controls="search-suggestions-list"
              />
              {isLoading && (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              )}
              {query && !isLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
                  aria-label="Xóa từ khóa"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions & Results List */}
            <div
              id="search-suggestions-list"
              role="listbox"
              className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/30"
            >
              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Gợi ý bài viết phù hợp</span>
                    <span className="text-[10px] lowercase font-normal">
                      Nhấn ↑↓ để chọn, Enter để mở
                    </span>
                  </div>
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
                          'group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors',
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/70 text-foreground'
                        )}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 pr-2">
                          <BookOpen className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary shrink-0" />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-medium leading-snug line-clamp-1">
                              <SearchHighlight text={item.titleEn} query={query} />
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              <SearchHighlight text={item.titleVi} query={query} />
                            </p>
                            {item.primaryCategory && (
                              <span className="inline-block text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded mt-1">
                                {item.primaryCategory.nameVi}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <CefrBadge level={item.cefrLevel} />
                          <ArrowRight
                            className={cn(
                              'w-3.5 h-3.5 transition-transform',
                              isSelected
                                ? 'text-primary translate-x-0.5'
                                : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : query.trim().length >= 2 && !isLoading ? (
                <div className="py-8 text-center text-muted-foreground space-y-2">
                  <p className="text-sm font-medium">Không tìm thấy gợi ý nào</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Nhấn Enter để thực hiện tìm kiếm toàn văn trong toàn bộ kho bài báo.
                  </p>
                </div>
              ) : (
                <div className="py-6 px-4 text-center space-y-3">
                  <div className="inline-flex p-2.5 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Tìm kiếm nhanh bài viết song ngữ
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Nhập từ khóa tiếng Anh hoặc tiếng Việt để xem gợi ý bài báo kèm cấp độ CEFR và chuyên mục.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-t text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Nhấn</span>
                <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">
                  Enter
                </kbd>
                <span>để tìm tất cả</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-1 py-0.5 bg-background border rounded font-mono text-[10px]">
                  Esc
                </kbd>
                <span>để đóng</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
