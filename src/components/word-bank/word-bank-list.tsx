'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WordBankItem } from '@/lib/queries/vocabulary';
import { WordBankCard } from '@/components/word-bank/word-bank-card';
import { WordBankEmpty } from '@/components/word-bank/word-bank-empty';
import { unsaveVocabularyAction } from '@/lib/actions/vocabulary';

interface WordBankListProps {
  initialItems: WordBankItem[];
  isFiltered?: boolean;
}

export function WordBankList({ initialItems, isFiltered = false }: WordBankListProps) {
  const router = useRouter();
  const [items, setItems] = useState<WordBankItem[]>(initialItems);
  const [statusAnnouncement, setStatusAnnouncement] = useState<string>('');
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const emptyHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Synchronize items when props change (e.g., search/filter or pagination updates)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const handleRemove = async (vocabularyId: string, index: number) => {
    const targetWord = items[index]?.vocabulary?.word || 'từ vựng';
    const updated = items.filter((item) => item.vocabularyId !== vocabularyId);
    setItems(updated);

    const result = await unsaveVocabularyAction({ vocabularyId });

    if (!result.success) {
      // Rollback on failure
      setItems(items);
      return;
    }

    setStatusAnnouncement(`Đã xóa từ ${targetWord} khỏi Sổ từ vựng.`);
    router.refresh();

    // Accessible focus restoration
    setTimeout(() => {
      if (updated.length === 0) {
        emptyHeadingRef.current?.focus();
      } else {
        const nextIndex = Math.min(index, updated.length - 1);
        cardRefs.current[nextIndex]?.focus();
      }
    }, 50);
  };

  if (items.length === 0) {
    return (
      <>
        {statusAnnouncement && (
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {statusAnnouncement}
          </div>
        )}
        <WordBankEmpty
          isFiltered={isFiltered}
          headingRef={emptyHeadingRef}
          onResetFilters={() => router.push('/word-bank')}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* Screen Reader Dynamic Action Status */}
      {statusAnnouncement && (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {statusAnnouncement}
        </div>
      )}

      {/* Responsive Word Bank Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {items.map((item, idx) => (
          <WordBankCard
            key={item.id}
            item={item}
            index={idx}
            onRemove={handleRemove}
            cardRef={(el) => {
              cardRefs.current[idx] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}
