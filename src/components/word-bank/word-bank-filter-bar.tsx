'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X, Filter } from 'lucide-react';
import { CefrLevel } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WordBankFilterBarProps {
  totalCount: number;
}

const CEFR_LEVELS: { label: string; value: string }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'B1', value: CefrLevel.B1 },
  { label: 'B2', value: CefrLevel.B2 },
  { label: 'C1', value: CefrLevel.C1 },
  { label: 'C2', value: CefrLevel.C2 },
  { label: 'A1', value: CefrLevel.A1 },
  { label: 'A2', value: CefrLevel.A2 },
];

export function WordBankFilterBar({ totalCount }: WordBankFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQ = searchParams.get('q') || '';
  const currentCefr = searchParams.get('cefr') || 'ALL';

  const [searchInputValue, setSearchInputValue] = useState(currentQ);

  const updateFilters = (newQ?: string, newCefr?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update query
    const targetQ = newQ !== undefined ? newQ : searchInputValue;
    if (targetQ && targetQ.trim().length >= 2) {
      params.set('q', targetQ.trim());
    } else {
      params.delete('q');
    }

    // Update CEFR
    const targetCefr = newCefr !== undefined ? newCefr : currentCefr;
    if (targetCefr && targetCefr !== 'ALL') {
      params.set('cefr', targetCefr);
    } else {
      params.delete('cefr');
    }

    // Reset page to 1 on filter change
    params.delete('page');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters();
  };

  const handleClearSearch = () => {
    setSearchInputValue('');
    updateFilters('');
  };

  const handleCefrSelect = (level: string) => {
    updateFilters(undefined, level);
  };

  return (
    <div className="space-y-4">
      {/* Screen Reader Live Results Announcer */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Tìm thấy {totalCount} từ vựng phù hợp
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <label htmlFor="word-bank-search" className="sr-only">
            Tìm kiếm từ vựng hoặc nghĩa tiếng Việt
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              id="word-bank-search"
              type="text"
              value={searchInputValue}
              onChange={(e) => setSearchInputValue(e.target.value)}
              placeholder="Tìm theo từ tiếng Anh hoặc nghĩa tiếng Việt..."
              maxLength={100}
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            {searchInputValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {/* CEFR Level Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none" role="group" aria-label="Lọc theo cấp độ CEFR">
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>CEFR:</span>
          </div>

          {CEFR_LEVELS.map((item) => {
            const isSelected = currentCefr === item.value;
            return (
              <Button
                key={item.value}
                type="button"
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCefrSelect(item.value)}
                aria-pressed={isSelected}
                className={cn(
                  'h-8 px-3 text-xs font-semibold rounded-lg shrink-0 transition-all',
                  isSelected
                    ? 'shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground border-border/80'
                )}
              >
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
