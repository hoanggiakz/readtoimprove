'use client';

import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { favoriteArticleAction, unfavoriteArticleAction } from '@/lib/actions/favorites';
import { useRouter } from 'next/navigation';

interface FavoriteButtonProps {
  articleId: string;
  initialFavorited?: boolean;
  isLoggedIn?: boolean;
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({
  articleId,
  initialFavorited = false,
  isLoggedIn = false,
  className = '',
  showText = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const previousState = isFavorited;
    // Optimistic UI update
    setIsFavorited(!previousState);
    setIsLoading(true);

    try {
      if (previousState) {
        const res = await unfavoriteArticleAction({ articleId });
        if (!res.success) {
          setIsFavorited(previousState);
        }
      } else {
        const res = await favoriteArticleAction({ articleId });
        if (!res.success) {
          setIsFavorited(previousState);
        }
      }
    } catch {
      setIsFavorited(previousState);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={isFavorited ? 'Bỏ lưu bài viết' : 'Lưu bài viết vào yêu thích'}
      aria-pressed={isFavorited}
      title={isFavorited ? 'Bỏ yêu thích' : 'Lưu bài viết yêu thích'}
      className={`inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 p-2 text-xs font-medium text-foreground backdrop-blur transition-all hover:border-border hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={`h-4 w-4 transition-colors ${
            isFavorited
              ? 'fill-rose-500 text-rose-500'
              : 'text-muted-foreground hover:text-rose-500'
          }`}
        />
      )}
      {showText && (
        <span className={isFavorited ? 'font-semibold text-rose-600 dark:text-rose-400' : 'text-muted-foreground'}>
          {isFavorited ? 'Đã lưu' : 'Lưu bài'}
        </span>
      )}
    </button>
  );
}
