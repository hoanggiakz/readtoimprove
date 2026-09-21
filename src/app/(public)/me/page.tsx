import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Flame,
  BookOpen,
  Clock,
  Bookmark,
  Heart,
  TrendingUp,
  History,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { requireAuth } from '@/lib/security';
import { getUserStats } from '@/lib/queries/user-stats';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Tổng quan tài khoản | ReadToImprove',
  description: 'Trung tâm học tập cá nhân, theo dõi chuỗi đọc và từ vựng đã lưu.',
};

export default async function MePage() {
  const user = await requireAuth('/me');
  const stats = await getUserStats(user.id);

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="space-y-8">
      {/* 1. USER PROFILE HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-xl sm:text-2xl font-black text-primary-foreground shadow-md">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {user.name}
                </h1>
                {user.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Admin</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{user.email}</p>
              <p className="text-[11px] text-muted-foreground">
                Thành viên rèn luyện kỹ năng đọc tin tức song ngữ Anh–Việt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/articles">
              <Button size="sm" className="gap-1.5 text-xs font-semibold">
                <BookOpen className="h-4 w-4" />
                <span>Đọc bài viết mới</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. CORE STAT METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Chuỗi đọc</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.currentStreakDays}{' '}
              <span className="text-sm font-medium text-muted-foreground">ngày</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Kỷ lục: <strong>{stats.longestStreakDays}</strong> ngày
            </p>
          </div>
        </div>

        {/* Total Articles Read */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Bài đã đọc</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalArticlesRead}{' '}
              <span className="text-sm font-medium text-muted-foreground">bài</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              +{stats.articlesReadLast7Days} bài trong 7 ngày
            </p>
          </div>
        </div>

        {/* Total Reading Time */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Thời gian đọc</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalReadingTimeMinutes}{' '}
              <span className="text-sm font-medium text-muted-foreground">phút</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Hoàn thành 100%: <strong>{stats.completedArticlesCount}</strong> bài
            </p>
          </div>
        </div>

        {/* Saved Vocabulary Words */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Từ vựng đã lưu</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Bookmark className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.savedWordsCount}{' '}
              <span className="text-sm font-medium text-muted-foreground">từ</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Trong sổ từ vựng cá nhân</p>
          </div>
        </div>
      </div>

      {/* 3. QUICK NAVIGATION HUB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress & Stats Card */}
        <Link
          href="/me/progress"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Tiến độ & Thống kê
                </h3>
                <p className="text-xs text-muted-foreground">
                  Xem biểu đồ đọc 7 ngày, chuỗi học tập và mục tiêu tuần
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Reading History Card */}
        <Link
          href="/me/reading-history"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Lịch sử đọc
                </h3>
                <p className="text-xs text-muted-foreground">
                  Danh sách bài đã đọc, tiếp tục đọc dở hoặc quản lý lịch sử
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Favorite Articles Card */}
        <Link
          href="/me/favorites"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Bài viết đã lưu
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bộ sưu tập các bài báo tin tức bạn đã đánh dấu yêu thích
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>

        {/* Word Bank Card */}
        <Link
          href="/word-bank"
          className="group rounded-2xl border border-border/80 bg-card p-6 shadow-xs transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Bookmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                  Sổ từ vựng cá nhân
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ôn tập từ vựng chuẩn CEFR kèm ngữ cảnh câu song ngữ
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>
    </div>
  );
}
