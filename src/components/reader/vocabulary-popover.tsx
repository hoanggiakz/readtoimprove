'use client';

import React, { useEffect, useRef } from 'react';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { VocabularyDetailDTO } from '@/lib/sentence-slicer';
import { Volume2, X } from 'lucide-react';

interface VocabularyPopoverProps {
  vocabulary: VocabularyDetailDTO;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function VocabularyPopover({
  vocabulary,
  onClose,
  triggerRef,
}: VocabularyPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on Escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        (!triggerRef?.current || !triggerRef.current.contains(e.target as Node))
      ) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, triggerRef]);

  // Audio pronunciation via Web Speech API or audioUrl
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vocabulary.audioUrl) {
      const audio = new Audio(vocabulary.audioUrl);
      audio.play().catch(() => {
        // Fallback to speech synthesis if audio play fails
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(vocabulary.word);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      });
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocabulary.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Chi tiết từ vựng ${vocabulary.word}`}
      className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 z-40 w-[290px] sm:w-[340px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/90 bg-popover p-4 shadow-xl backdrop-blur-sm text-popover-foreground transition-all duration-150 animate-in fade-in-50 zoom-in-95"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5 mb-2.5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-foreground font-sans tracking-tight">
              {vocabulary.word}
            </span>
            <CefrBadge level={vocabulary.cefrLevel} showLabel={false} className="text-[10px]" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {vocabulary.ipa && (
              <span className="font-mono text-primary/90 font-medium">
                {vocabulary.ipa}
              </span>
            )}
            {vocabulary.pos && (
              <span className="italic">
                ({vocabulary.pos})
              </span>
            )}
            <button
              type="button"
              onClick={handlePronounce}
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
              title="Nghe phát âm"
              aria-label={`Nghe phát âm ${vocabulary.word}`}
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/80 transition-colors"
          title="Đóng (Esc)"
          aria-label="Đóng bảng từ vựng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Vietnamese Meaning */}
      <div className="mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-1">
          Nghĩa Tiếng Việt
        </div>
        <p className="text-sm font-semibold text-foreground leading-snug">
          {vocabulary.meaningVi}
        </p>
      </div>

      {/* Contextual Examples if available */}
      {(vocabulary.exampleEn || vocabulary.exampleVi) && (
        <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-xs space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Ví dụ ngữ cảnh
          </div>
          {vocabulary.exampleEn && (
            <p className="text-foreground/90 font-medium italic leading-relaxed">
              &ldquo;{vocabulary.exampleEn}&rdquo;
            </p>
          )}
          {vocabulary.exampleVi && (
            <p className="text-muted-foreground leading-relaxed">
              {vocabulary.exampleVi}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
