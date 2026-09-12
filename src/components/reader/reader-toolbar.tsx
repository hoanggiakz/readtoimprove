'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Languages, Type, Eye, MousePointerClick, EyeOff } from 'lucide-react';

export type TranslationMode = 'ALL' | 'INTERACTIVE' | 'HIDE';
export type ReaderFontSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EXTRA_LARGE';

interface ReaderToolbarProps {
  translationMode: TranslationMode;
  onTranslationModeChange: (mode: TranslationMode) => void;
  fontSize: ReaderFontSize;
  onFontSizeChange: (size: ReaderFontSize) => void;
  sentenceCount?: number;
  className?: string;
}

export function ReaderToolbar({
  translationMode,
  onTranslationModeChange,
  fontSize,
  onFontSizeChange,
  sentenceCount,
  className,
}: ReaderToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Tùy chỉnh chế độ đọc bài viết"
      className={cn(
        'sticky top-16 z-30 w-full py-2.5 px-4 sm:px-6 rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md shadow-xs transition-all flex flex-wrap items-center justify-between gap-3',
        className
      )}
    >
      {/* Left: Translation Mode Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
          <Languages className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Bản dịch:</span>
        </span>

        {/* Mode: ALL */}
        <button
          type="button"
          onClick={() => onTranslationModeChange('ALL')}
          aria-pressed={translationMode === 'ALL'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            translationMode === 'ALL'
              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
              : 'bg-card text-foreground/80 border-border hover:bg-muted/70'
          )}
          title="Luôn hiển thị bản dịch tiếng Việt bên dưới mỗi câu"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Hiện tất cả</span>
        </button>

        {/* Mode: INTERACTIVE */}
        <button
          type="button"
          onClick={() => onTranslationModeChange('INTERACTIVE')}
          aria-pressed={translationMode === 'INTERACTIVE'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            translationMode === 'INTERACTIVE'
              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
              : 'bg-card text-foreground/80 border-border hover:bg-muted/70'
          )}
          title="Rê chuột, bấm vào câu hoặc chạm để mở bản dịch tiếng Việt"
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          <span>Rê chuột / Chạm</span>
        </button>

        {/* Mode: HIDE */}
        <button
          type="button"
          onClick={() => onTranslationModeChange('HIDE')}
          aria-pressed={translationMode === 'HIDE'}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            translationMode === 'HIDE'
              ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
              : 'bg-card text-foreground/80 border-border hover:bg-muted/70'
          )}
          title="Ẩn bản dịch tiếng Việt để luyện đọc hiểu thuần tiếng Anh"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Ẩn dịch</span>
        </button>
      </div>

      {/* Right: Font Size Controls & Sentence Count */}
      <div className="flex items-center gap-3">
        {sentenceCount !== undefined && sentenceCount > 0 && (
          <span className="text-xs text-muted-foreground hidden md:inline">
            {sentenceCount} câu song ngữ
          </span>
        )}

        <div className="flex items-center gap-1 border-l pl-3 border-border/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
            <Type className="w-3.5 h-3.5 text-primary" />
            <span className="sr-only">Cỡ chữ</span>
          </span>

          <button
            type="button"
            onClick={() => onFontSizeChange('SMALL')}
            aria-pressed={fontSize === 'SMALL'}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              fontSize === 'SMALL'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'bg-card text-foreground/80 border-border hover:bg-muted'
            )}
            title="Cỡ chữ nhỏ (16px)"
            aria-label="Cỡ chữ nhỏ"
          >
            A-
          </button>

          <button
            type="button"
            onClick={() => onFontSizeChange('MEDIUM')}
            aria-pressed={fontSize === 'MEDIUM'}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              fontSize === 'MEDIUM'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'bg-card text-foreground/80 border-border hover:bg-muted'
            )}
            title="Cỡ chữ chuẩn (18px)"
            aria-label="Cỡ chữ chuẩn"
          >
            A
          </button>

          <button
            type="button"
            onClick={() => onFontSizeChange('LARGE')}
            aria-pressed={fontSize === 'LARGE'}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              fontSize === 'LARGE'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'bg-card text-foreground/80 border-border hover:bg-muted'
            )}
            title="Cỡ chữ lớn (20px)"
            aria-label="Cỡ chữ lớn"
          >
            A+
          </button>

          <button
            type="button"
            onClick={() => onFontSizeChange('EXTRA_LARGE')}
            aria-pressed={fontSize === 'EXTRA_LARGE'}
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              fontSize === 'EXTRA_LARGE'
                ? 'bg-foreground text-background border-foreground font-bold'
                : 'bg-card text-foreground/80 border-border hover:bg-muted'
            )}
            title="Cỡ chữ rất lớn (22px)"
            aria-label="Cỡ chữ rất lớn"
          >
            A++
          </button>
        </div>
      </div>
    </div>
  );
}
