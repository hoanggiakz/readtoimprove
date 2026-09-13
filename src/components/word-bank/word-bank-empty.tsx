'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, SearchX, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WordBankEmptyProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
  headingRef?: React.RefObject<HTMLHeadingElement | null>;
}

export function WordBankEmpty({
  isFiltered = false,
  onResetFilters,
  headingRef,
}: WordBankEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-14 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 my-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        {isFiltered ? <SearchX className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-lg sm:text-xl font-bold text-foreground mb-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
      >
        {isFiltered
          ? 'Không tìm thấy từ vựng phù hợp'
          : 'Sổ từ vựng của bạn đang trống'}
      </h2>

      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
        {isFiltered
          ? 'Thử thay đổi từ khóa tìm kiếm hoặc chọn cấp độ CEFR khác để xem các từ vựng đã lưu.'
          : 'Khi đọc các bài báo song ngữ Anh–Việt, hãy bấm vào các từ vựng nổi bật và chọn "Lưu vào Sổ từ" để xây dựng bộ sưu tập từ vựng của riêng bạn.'}
      </p>

      {isFiltered ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="font-medium text-xs"
        >
          Xóa bộ lọc tìm kiếm
        </Button>
      ) : (
        <Link href="/articles">
          <Button size="sm" className="gap-2 font-medium text-xs">
            <span>Bắt đầu đọc báo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      )}
    </div>
  );
}
