import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  Flame,
  BookOpen,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { requireAuth } from '@/lib/security';
import { getUserStats } from '@/lib/queries/user-stats';
import { WeeklyActivityChart } from '@/components/me/weekly-activity-chart';
import { ReadingGoalCard } from '@/components/me/reading-goal-card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Tiến độ học tập | ReadToImprove',
  description: 'Thống kê chuỗi ngày đọc, biểu đồ đọc tin tức và mục tiêu rèn luyện tiếng Anh.',
};

export default async function ProgressPage() {
  const user = await requireAuth('/me/progress');
  const stats = await getUserStats(user.id);

  const completionRate =
    stats.totalArticlesRead > 0
      ? Math.round((stats.completedArticlesCount / stats.totalArticlesRead) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Tiến độ & Thống kê học tập
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Theo dõi sự tiến bộ, duy trì thói quen đọc tin tức tiếng Anh mỗi ngày.
          </p>
        </div>

        <Link href="/articles">
          <Button size="sm" className="gap-1.5 text-xs font-semibold">
            <BookOpen className="h-4 w-4" />
            <span>Luyện đọc ngay</span>
          </Button>
        </Link>
      </div>

      {/* 2. PRIMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Chuỗi học tập</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">
              {stats.currentStreakDays}{' '}
              <span className="text-sm font-medium text-muted-foreground">ngày liên tiếp</span>
            </div>
            <p className="text-xs font-medium">
              {stats.hasReadToday ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Hôm nay bạn đã đọc bài!</span>
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">
                  Đọc 1 bài hôm nay để duy trì chuỗi
                </span>
              )}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
            Kỷ lục dài nhất: <strong>{stats.longestStreakDays}</strong> ngày
          </p>
        </div>

        {/* Total Read Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tổng bài đã đọc</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">
              {stats.totalArticlesRead}{' '}
              <span className="text-sm font-medium text-muted-foreground">bài</span>
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.articlesReadLast7Days} bài trong 7 ngày qua
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
            30 ngày gần đây: <strong>{stats.articlesReadLast30Days}</strong> bài
          </p>
        </div>

        {/* Reading Time Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Thời gian đọc tích luỹ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">
              {stats.totalReadingTimeMinutes}{' '}
              <span className="text-sm font-medium text-muted-foreground">phút</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Trung bình ~{stats.totalArticlesRead > 0 ? Math.round(stats.totalReadingTimeMinutes / stats.totalArticlesRead) : 0} phút/bài
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
            Bài hoàn thành 100%: <strong>{stats.completedArticlesCount}</strong> bài
          </p>
        </div>

        {/* Completion Rate Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tỷ lệ hoàn thành</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-foreground">
              {completionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedArticlesCount} xong / {stats.inProgressArticlesCount} đang đọc dở
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground border-t border-border/60 pt-2">
            Từ vựng đã lưu: <strong>{stats.savedWordsCount}</strong> từ
          </p>
        </div>
      </div>

      {/* 3. WEEKLY GOAL SETTING */}
      <ReadingGoalCard
        target={stats.weeklyGoal.target}
        completedThisWeek={stats.weeklyGoal.completedThisWeek}
        percentage={stats.weeklyGoal.percentage}
      />

      {/* 4. WEEKLY ACTIVITY SVG CHART */}
      <WeeklyActivityChart activity={stats.weeklyActivity} />
    </div>
  );
}
