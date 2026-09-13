'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { VocabularyDetailDTO } from '@/lib/sentence-slicer';
import { Volume2, X, Bookmark, BookmarkCheck, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VocabularyPopoverProps {
  vocabulary: VocabularyDetailDTO;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  isSaved?: boolean;
  onToggleSave?: () => Promise<void>;
  isAuthenticated?: boolean;
}

export function VocabularyPopover({
  vocabulary,
  onClose,
  triggerRef,
  isSaved = false,
  onToggleSave,
  isAuthenticated = false,
}: VocabularyPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAuthNotice, setShowAuthNotice] = useState(false);

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

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setShowAuthNotice(true);
      return;
    }

    if (!onToggleSave || isSaving) return;

    try {
      setIsSaving(true);
      await onToggleSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Chi tiết từ vựng ${vocabulary.word}`}
      className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 z-40 w-[300px] sm:w-[350px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/90 bg-popover p-4 shadow-xl backdrop-blur-sm text-popover-foreground transition-all duration-150 animate-in fade-in-50 zoom-in-95"
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
        <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-xs space-y-1 mb-3">
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

      {/* Unauthenticated Login Notice */}
      {showAuthNotice && (
        <div className="mb-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>Đăng nhập để lưu vào Sổ từ vựng cá nhân</span>
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
          >
            <LogIn className="w-3 h-3" />
            <span>Đăng nhập</span>
          </Link>
        </div>
      )}

      {/* Save / Unsave Action Button */}
      <div className="pt-2 border-t border-border/60">
        <Button
          type="button"
          size="sm"
          variant={isSaved ? 'secondary' : 'outline'}
          onClick={handleSaveClick}
          disabled={isSaving}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Bỏ lưu từ ${vocabulary.word}` : `Lưu từ ${vocabulary.word} vào Sổ từ vựng`}
          className={cn(
            'w-full text-xs font-medium gap-1.5 h-8 transition-colors',
            isSaved && 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Đang xử lý...</span>
            </>
          ) : isSaved ? (
            <>
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>✓ Đã lưu vào Sổ từ</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5" />
              <span>☆ Lưu vào Sổ từ</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
