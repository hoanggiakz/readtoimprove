'use client';

import React, { useState, useRef } from 'react';
import { sliceSentenceText, HighlightMetadata } from '@/lib/sentence-slicer';
import { TranslationMode, ReaderFontSize } from '@/components/reader/reader-toolbar';
import { VocabularyPopover } from '@/components/reader/vocabulary-popover';
import { getCefrInfo } from '@/lib/cefr';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export interface SentenceDTO {
  id: string;
  orderIndex: number;
  textEn: string;
  textVi: string;
  vocabularies: HighlightMetadata[];
}

interface BilingualSentenceItemProps {
  sentence: SentenceDTO;
  translationMode: TranslationMode;
  fontSize: ReaderFontSize;
  isActive: boolean;
  onActivate: () => void;
}

export function BilingualSentenceItem({
  sentence,
  translationMode,
  fontSize,
  isActive,
  onActivate,
}: BilingualSentenceItemProps) {
  const [activeHighlight, setActiveHighlight] = useState<HighlightMetadata | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const activeTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Slices English text into non-highlighted and highlighted segments
  const slices = sliceSentenceText(sentence.textEn, sentence.vocabularies);

  // Determine font size CSS class
  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'SMALL':
        return 'text-base leading-relaxed';
      case 'LARGE':
        return 'text-xl leading-relaxed sm:leading-loose';
      case 'EXTRA_LARGE':
        return 'text-2xl leading-relaxed sm:leading-loose';
      case 'MEDIUM':
      default:
        return 'text-lg leading-relaxed';
    }
  };

  // Determine whether Vietnamese translation is visible
  const isTranslationVisible =
    translationMode === 'ALL' ||
    (translationMode === 'INTERACTIVE' && isRevealed);

  return (
    <div
      onClick={onActivate}
      className={cn(
        'group relative p-4 sm:p-5 rounded-xl border transition-all duration-150',
        isActive
          ? 'border-primary/60 bg-primary/[0.03] shadow-xs'
          : 'border-border/70 bg-card hover:border-primary/30'
      )}
    >
      {/* Top Sentence Header Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span className="font-mono font-bold text-primary/80 tracking-wider">
          #{String(sentence.orderIndex + 1).padStart(2, '0')}
        </span>

        {/* Interactive Mode Toggle Button */}
        {translationMode === 'INTERACTIVE' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsRevealed(!isRevealed);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline px-1.5 py-0.5 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-expanded={isRevealed}
            aria-label={isRevealed ? 'Ẩn bản dịch tiếng Việt' : 'Hiện bản dịch tiếng Việt'}
          >
            {isRevealed ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Ẩn dịch</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Xem dịch</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* English Sentence with Highlights */}
      <p className={cn('font-sans font-medium text-foreground tracking-normal', getFontSizeClasses())}>
        {slices.map((slice, idx) => {
          if (!slice.isHighlight || !slice.highlight?.vocabulary) {
            return <React.Fragment key={idx}>{slice.text}</React.Fragment>;
          }

          const vocab = slice.highlight.vocabulary;
          const cefrInfo = getCefrInfo(vocab.cefrLevel);
          const isCurrentOpen = activeHighlight?.id === slice.highlight.id;

          return (
            <span key={idx} className="relative inline-block">
              <button
                type="button"
                ref={isCurrentOpen ? activeTriggerRef : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  onActivate();
                  setActiveHighlight(isCurrentOpen ? null : slice.highlight!);
                }}
                aria-haspopup="dialog"
                aria-expanded={isCurrentOpen}
                aria-label={`Từ vựng: ${vocab.word}, cấp độ ${vocab.cefrLevel}`}
                className={cn(
                  'relative rounded px-1 py-0.5 font-semibold underline underline-offset-4 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  cefrInfo.highlightClasses,
                  isCurrentOpen && 'ring-2 ring-primary/60'
                )}
              >
                {slice.text}
              </button>

              {/* Vocabulary Definition Popover */}
              {isCurrentOpen && (
                <VocabularyPopover
                  vocabulary={vocab}
                  onClose={() => setActiveHighlight(null)}
                  triggerRef={activeTriggerRef}
                />
              )}
            </span>
          );
        })}
      </p>

      {/* Vietnamese Aligned Translation */}
      {translationMode !== 'HIDE' && (
        <div
          className={cn(
            'transition-all duration-200 overflow-hidden',
            isTranslationVisible
              ? 'mt-3 pt-3 border-t border-dashed border-border/70 opacity-100'
              : 'max-h-0 opacity-0'
          )}
        >
          <p className="font-serif italic text-muted-foreground text-sm sm:text-base leading-relaxed">
            {sentence.textVi}
          </p>
        </div>
      )}
    </div>
  );
}
