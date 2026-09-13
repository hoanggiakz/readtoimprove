'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Volume2, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { Button } from '@/components/ui/button';
import { WordBankItem } from '@/lib/queries/vocabulary';

interface WordBankCardProps {
  item: WordBankItem;
  index: number;
  onRemove: (vocabularyId: string, index: number) => Promise<void>;
  cardRef?: (el: HTMLElement | null) => void;
}

export function WordBankCard({ item, index, onRemove, cardRef }: WordBankCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const vocab = item.vocabulary;
  const context = item.context;

  const formattedDate = item.savedAt
    ? new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(item.savedAt))
    : '';

  // Handle audio pronunciation
  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vocab.audioUrl) {
      const audio = new Audio(vocab.audioUrl);
      audio.play().catch(() => {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(vocab.word);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }
      });
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(vocab.word);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRemoveClick = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await onRemove(vocab.id, index);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article
      ref={cardRef}
      tabIndex={0}
      aria-labelledby={`vocab-word-${vocab.id}`}
      className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/80 bg-card hover:border-primary/40 hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="space-y-3.5">
        {/* Top Header: Word, CEFR, IPA, Audio */}
        <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                id={`vocab-word-${vocab.id}`}
                className="font-bold text-lg text-foreground tracking-tight"
              >
                {vocab.word}
              </h3>
              <CefrBadge level={vocab.cefrLevel} showLabel={false} className="text-[10px]" />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {vocab.ipa && (
                <span className="font-mono text-primary font-medium">{vocab.ipa}</span>
              )}
              {vocab.pos && <span className="italic">({vocab.pos})</span>}
              <button
                type="button"
                onClick={handlePronounce}
                className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                title={`Nghe phát âm từ ${vocab.word}`}
                aria-label={`Nghe phát âm từ ${vocab.word}`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Vietnamese Definition */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">
            Nghĩa tiếng Việt
          </div>
          <p className="text-sm font-semibold text-foreground leading-snug">
            {vocab.meaningVi}
          </p>
        </div>

        {/* Context or Examples */}
        {context?.sentence ? (
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ngữ cảnh trong bài
            </div>
            <p className="text-foreground font-medium italic leading-relaxed">
              &ldquo;{context.sentence.textEn}&rdquo;
            </p>
            {context.sentence.textVi && (
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {context.sentence.textVi}
              </p>
            )}
            <div className="pt-1">
              <Link
                href={`/articles/${context.sentence.article.slug}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                <span>Xem bài: {context.sentence.article.titleEn}</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (vocab.exampleEn || vocab.exampleVi) ? (
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Ví dụ
            </div>
            {vocab.exampleEn && (
              <p className="text-foreground font-medium italic leading-relaxed">
                &ldquo;{vocab.exampleEn}&rdquo;
              </p>
            )}
            {vocab.exampleVi && (
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {vocab.exampleVi}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer: Date Saved & Remove Action */}
      <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span className="text-[11px]">Đã lưu: {formattedDate}</span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveClick}
          disabled={isDeleting}
          aria-label={`Xóa từ vựng ${vocab.word} khỏi sổ từ`}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1 transition-colors"
        >
          {isDeleting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Xóa</span>
        </Button>
      </div>
    </article>
  );
}
