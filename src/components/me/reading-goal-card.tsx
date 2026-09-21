'use client';

import React, { useState } from 'react';
import { Target, Trophy, Edit2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateReadingGoalAction } from '@/lib/actions/goals';
import { useRouter } from 'next/navigation';

interface ReadingGoalCardProps {
  target: number;
  completedThisWeek: number;
  percentage: number;
}

export function ReadingGoalCard({
  target,
  completedThisWeek,
  percentage,
}: ReadingGoalCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [goalValue, setGoalValue] = useState(target);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (goalValue < 1 || goalValue > 50) return;
    setIsLoading(true);

    try {
      const res = await updateReadingGoalAction({ weeklyGoal: goalValue });
      if (res.success) {
        setIsEditing(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAchieved = percentage >= 100;

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isAchieved
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-primary/10 text-primary'
            }`}
          >
            {isAchieved ? <Trophy className="h-5 w-5" /> : <Target className="h-5 w-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Mục tiêu đọc hàng tuần</h4>
            <p className="text-xs text-muted-foreground">
              {isAchieved
                ? '🎉 Xuất sắc! Bạn đã đạt mục tiêu tuần này'
                : 'Duy trì thói quen đọc đều đặn mỗi tuần'}
            </p>
          </div>
        </div>

        {!isEditing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Đổi mục tiêu</span>
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <label htmlFor="goal-input" className="text-xs text-muted-foreground">
              Số bài/tuần:
            </label>
            <input
              id="goal-input"
              type="number"
              min={1}
              max={50}
              value={goalValue}
              onChange={(e) => setGoalValue(Number(e.target.value))}
              className="w-16 rounded-lg border border-border bg-background px-2.5 py-1 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isLoading || goalValue < 1 || goalValue > 50}
            className="h-8 gap-1 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Lưu</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setGoalValue(target);
              setIsEditing(false);
            }}
            className="h-8 text-xs text-muted-foreground"
          >
            Huỷ
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Tiến độ: <strong>{completedThisWeek}</strong> / {target} bài
            </span>
            <span className={`font-bold ${isAchieved ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
              {percentage}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isAchieved ? 'bg-gradient-to-r from-amber-500 to-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
