'use client';

import React, { useState } from 'react';
import { BookmarkCheck, X, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResumeReadingBannerProps {
  initialProgress: number;
}

export function ResumeReadingBanner({ initialProgress }: ResumeReadingBannerProps) {
  const [isVisible, setIsVisible] = useState(
    initialProgress >= 10 && initialProgress < 90
  );

  if (!isVisible) return null;

  const handleResume = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight > 0) {
      const targetY = (initialProgress / 100) * docHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
    setIsVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Tiếp tục đọc bài viết"
      className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 text-xs sm:text-sm text-foreground flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-in fade-in-0 slide-in-from-top-2 duration-300"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BookmarkCheck className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-foreground">Bạn đang đọc dở bài viết này </span>
          <span className="text-muted-foreground font-medium">
            (tiến độ đã lưu: <strong className="text-primary font-bold">{initialProgress}%</strong>)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        <Button
          size="sm"
          variant="default"
          onClick={handleResume}
          className="h-8 gap-1.5 text-xs font-semibold"
        >
          <span>Tiếp tục đọc</span>
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Đóng thông báo"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
