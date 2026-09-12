'use client';

import React, { useState, useEffect } from 'react';
import {
  ReaderToolbar,
  TranslationMode,
  ReaderFontSize,
} from '@/components/reader/reader-toolbar';
import {
  BilingualSentenceItem,
  SentenceDTO,
} from '@/components/reader/bilingual-sentence-item';
import { BookOpen } from 'lucide-react';

interface BilingualSentenceListProps {
  sentences: SentenceDTO[];
}

const STORAGE_TRANSLATION_KEY = 'readtoimprove:translation-mode';
const STORAGE_FONT_KEY = 'readtoimprove:reader-font-size';

export function BilingualSentenceList({ sentences }: BilingualSentenceListProps) {
  // Initial SSR state defaults to ALL and MEDIUM to guarantee full indexability and avoid hydration mismatch
  const [translationMode, setTranslationMode] = useState<TranslationMode>('ALL');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('MEDIUM');
  const [activeSentenceId, setActiveSentenceId] = useState<string | null>(null);

  // Sync preference from localStorage after initial hydration
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_TRANSLATION_KEY) as TranslationMode | null;
      if (savedMode && ['ALL', 'INTERACTIVE', 'HIDE'].includes(savedMode)) {
        setTranslationMode(savedMode);
      }

      const savedFont = localStorage.getItem(STORAGE_FONT_KEY) as ReaderFontSize | null;
      if (savedFont && ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'].includes(savedFont)) {
        setFontSize(savedFont);
      }
    } catch {
      // Ignore localStorage errors in private browsing/restricted environments
    }
  }, []);

  const handleTranslationModeChange = (mode: TranslationMode) => {
    setTranslationMode(mode);
    try {
      localStorage.setItem(STORAGE_TRANSLATION_KEY, mode);
    } catch {
      // Ignore storage errors
    }
  };

  const handleFontSizeChange = (size: ReaderFontSize) => {
    setFontSize(size);
    try {
      localStorage.setItem(STORAGE_FONT_KEY, size);
    } catch {
      // Ignore storage errors
    }
  };

  if (!sentences || sentences.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 my-6">
        <BookOpen className="w-8 h-8 text-muted-foreground/60 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">
          Chưa có nội dung câu song ngữ
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Bài viết này đang được cập nhật các câu đối chiếu và từ vựng trọng tâm.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Reader Controls Toolbar */}
      <ReaderToolbar
        translationMode={translationMode}
        onTranslationModeChange={handleTranslationModeChange}
        fontSize={fontSize}
        onFontSizeChange={handleFontSizeChange}
        sentenceCount={sentences.length}
      />

      {/* Sequential Bilingual Sentences */}
      <section
        aria-label="Nội dung bài báo song ngữ"
        className="space-y-4 pt-2"
      >
        {sentences.map((sentence) => (
          <BilingualSentenceItem
            key={sentence.id}
            sentence={sentence}
            translationMode={translationMode}
            fontSize={fontSize}
            isActive={activeSentenceId === sentence.id}
            onActivate={() => setActiveSentenceId(sentence.id)}
          />
        ))}
      </section>
    </div>
  );
}
