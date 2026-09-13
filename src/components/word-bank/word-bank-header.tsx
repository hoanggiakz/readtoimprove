import React from 'react';
import Link from 'next/link';
import { Bookmark, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WordBankHeaderProps {
  totalCount: number;
}

export function WordBankHeader({ totalCount }: WordBankHeaderProps) {
  return (
    <div className="space-y-4 pb-6 border-b border-border/70">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        <span className="text-foreground font-medium">Sổ từ vựng cá nhân</span>
      </nav>

      {/* Main Title & Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-xs">
              <Bookmark className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Sổ từ vựng cá nhân
            </h1>
            <Badge variant="secondary" className="font-semibold text-xs h-6 px-2.5">
              {totalCount} {totalCount === 1 ? 'từ' : 'từ vựng'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl pt-0.5">
            Tổng hợp các từ vựng trọng tâm bạn đã lưu trong quá trình đọc báo song ngữ. Giữ lại ngữ cảnh thực tế giúp tăng khả năng ghi nhớ dài hạn.
          </p>
        </div>
      </div>
    </div>
  );
}
