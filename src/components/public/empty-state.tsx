import React from 'react';
import Link from 'next/link';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  resetUrl?: string;
  resetLabel?: string;
}

export function EmptyState({
  title = 'Không tìm thấy bài viết phù hợp',
  description = 'Rất tiếc, không có bài viết nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.',
  resetUrl = '/articles',
  resetLabel = 'Xóa tất cả bộ lọc',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/40 my-8">
      <div className="p-4 rounded-full bg-muted/60 text-muted-foreground mb-4">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {resetUrl && (
        <Link href={resetUrl}>
          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>{resetLabel}</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
