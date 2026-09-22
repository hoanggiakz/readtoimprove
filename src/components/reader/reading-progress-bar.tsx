'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { recordReadingProgressAction } from '@/lib/actions/reading-history';

interface ReadingProgressBarProps {
  articleId?: string;
  initialProgress?: number;
  isLoggedIn?: boolean;
  slug?: string;
  titleEn?: string;
  titleVi?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

export function ReadingProgressBar({
  articleId,
  initialProgress = 0,
  isLoggedIn = false,
  slug = '',
  titleEn = '',
  titleVi = '',
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const lastSavedProgressRef = useRef(initialProgress);
  const latestProgressRef = useRef(initialProgress);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persistence function
  const persistProgress = useCallback(
    async (percentageToSave: number) => {
      if (!articleId) return;
      if (percentageToSave < 0 || percentageToSave > 100) return;

      // Skip if change is negligible (< 2% and not completed)
      const diff = Math.abs(percentageToSave - lastSavedProgressRef.current);
      if (diff < 2 && percentageToSave < 90 && percentageToSave > 0) {
        return;
      }

      setSaveStatus('saving');

      if (isLoggedIn) {
        try {
          const res = await recordReadingProgressAction({
            articleId,
            readPercentage: percentageToSave,
          });
          if (res.success) {
            lastSavedProgressRef.current = Math.max(
              lastSavedProgressRef.current,
              percentageToSave
            );
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          } else {
            setSaveStatus('idle');
          }
        } catch {
          setSaveStatus('idle');
        }
      } else {
        // Guest localStorage persistence
        try {
          const raw = localStorage.getItem('readtoimprove_guest_history');
          let history: Array<{
            articleId: string;
            slug: string;
            titleEn: string;
            titleVi: string;
            readPercentage: number;
            lastReadAt: string;
          }> = [];

          if (raw) {
            try {
              history = JSON.parse(raw);
            } catch {
              history = [];
            }
          }

          const existingIndex = history.findIndex((h) => h.articleId === articleId);
          const currentPercentage =
            existingIndex >= 0
              ? Math.max(history[existingIndex].readPercentage, percentageToSave)
              : percentageToSave;

          const entry = {
            articleId,
            slug,
            titleEn,
            titleVi,
            readPercentage: currentPercentage,
            lastReadAt: new Date().toISOString(),
          };

          if (existingIndex >= 0) {
            history[existingIndex] = entry;
          } else {
            history.unshift(entry);
          }

          // Limit guest history to 50 items
          localStorage.setItem(
            'readtoimprove_guest_history',
            JSON.stringify(history.slice(0, 50))
          );
          lastSavedProgressRef.current = currentPercentage;
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (storageErr) {
          console.warn('Failed to save guest reading progress:', storageErr);
          setSaveStatus('idle');
        }
      }
    },
    [articleId, isLoggedIn, slug, titleEn, titleVi]
  );

  // Scroll handler
  useEffect(() => {
    let ticking = false;

    const updateProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight > 0) {
        const percentage = Math.min(
          100,
          Math.max(0, Math.round((scrollY / docHeight) * 100))
        );
        setProgress(percentage);
        latestProgressRef.current = percentage;

        // Debounced save every 5,000ms
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          void persistProgress(percentage);
        }, 5000);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Flush immediately on tab switch or page unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        void persistProgress(latestProgressRef.current);
      }
    };

    const handlePageHide = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      void persistProgress(latestProgressRef.current);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [persistProgress]);

  return (
    <>
      <div
        role="progressbar"
        aria-label="Tiến độ đọc bài viết"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="fixed top-0 left-0 right-0 h-1 bg-transparent z-50 pointer-events-none"
      >
        <div
          className="h-full bg-primary transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Subtle Saving Indicator */}
      {saveStatus !== 'idle' && (
        <div
          aria-live="polite"
          aria-atomic="true"
          className="fixed top-2.5 right-4 z-50 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 backdrop-blur px-2.5 py-0.5 text-[11px] font-medium text-foreground shadow-xs animate-in fade-in duration-200"
        >

          {saveStatus === 'saving' && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground">Đang lưu {progress}%...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400">Đã lưu {progress}%</span>
            </>
          )}
        </div>
      )}
    </>
  );
}
