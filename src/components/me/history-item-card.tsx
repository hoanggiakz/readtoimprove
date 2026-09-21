'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Clock, Trash2, CheckCircle2, BookOpen, Loader2 } from 'lucide-react';
import { CefrBadge } from '@/components/ui/cefr-badge';
import { Button } from '@/components/ui/button';
import { clearReadingHistoryAction } from '@/lib/actions/reading-history';
import { ReadingHistoryItem } from '@/lib/queries/user-history';

interface HistoryItemCardProps {
  item: ReadingHistoryItem;
}

export function HistoryItemCard({ item }: HistoryItemCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const { article, readPercentage, completed, lastReadAt } = item;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDeleting) return;
    setIsDeleting(true);

    try {
      const res = await clearReadingHistoryAction({ articleId: article.id });
      if (res.success) {
        setIsDeleted(true);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to remove history item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) return null;

  const formattedDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(lastReadAt));

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 transition-all hover:border-primary/30 hover:shadow-md">
      {/* Thumbnail + Details */}
      <div className="flex items-start gap-4 flex-1 min-w-0 w-full sm:w-auto">
        {article.thumbnailUrl ? (
          <div className="relative h-20 w-28 sm:h-24 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
            <Image
              src={article.thumbnailUrl}
              alt={article.titleEn}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-20 w-28 sm:h-24 sm:w-32 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/60 text-muted-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2">
            <CefrBadge level={article.cefrLevel} showLabel={false} className="text-[10px] px-2 py-0.5" />
            {article.categories?.[0] && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {article.categories[0].category.nameVi}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{article.readingTimeMinutes} phút đọc</span>
            </span>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              • Lần đọc cuối: {formattedDate}
            </span>
          </div>

          {/* Titles */}
          <Link href={`/articles/${article.slug}`} className="block group-hover:text-primary transition-colors">
            <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug truncate">
              {article.titleEn}
            </h3>
            <p className="text-xs text-muted-foreground font-serif italic truncate">
              {article.titleVi}
            </p>
          </Link>

          {/* Reading Progress Indicator */}
          <div className="pt-1 space-y-1 max-w-xs">
            <div className="flex items-center justify-between text-[11px]">
              {completed ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Đã hoàn thành (100%)</span>
                </span>
              ) : (
                <span className="text-muted-foreground font-medium">
                  Đã đọc: <strong className="text-foreground">{readPercentage}%</strong>
                </span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all duration-300 ${
                  completed ? 'bg-emerald-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.max(readPercentage, 5)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
        <Link href={`/articles/${article.slug}`}>
          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{completed ? 'Đọc lại' : 'Đọc tiếp'}</span>
          </Button>
        </Link>

        <Button
          size="icon"
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Xoá khỏi lịch sử"
          aria-label={`Xoá bài viết ${article.titleEn} khỏi lịch sử đọc`}
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
