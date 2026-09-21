'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearReadingHistoryAction } from '@/lib/actions/reading-history';

export function ClearHistoryDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClear = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await clearReadingHistoryAction({ timeframe });
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setErrorMessage(res.message || 'Không thể xoá lịch sử đọc.');
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi khi xoá lịch sử.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Xoá lịch sử</span>
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-history-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Dialog Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="clear-history-title" className="text-base font-bold text-foreground">
                    Xoá lịch sử đọc bài
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Chọn khoảng thời gian bạn muốn xoá khỏi tài khoản
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            {/* Timeframe Radio Options */}
            <div className="space-y-2.5">
              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  timeframe === '7d'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="timeframe"
                    value="7d"
                    checked={timeframe === '7d'}
                    onChange={() => setTimeframe('7d')}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground">Trong 7 ngày gần đây</span>
                    <span className="text-[11px] text-muted-foreground">Giữ lại các bài đọc trước đó</span>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  timeframe === '30d'
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="timeframe"
                    value="30d"
                    checked={timeframe === '30d'}
                    onChange={() => setTimeframe('30d')}
                    className="text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold block text-foreground">Trong 30 ngày gần đây</span>
                    <span className="text-[11px] text-muted-foreground">Giữ lại các bài đọc cũ hơn 1 tháng</span>
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  timeframe === 'all'
                    ? 'border-destructive bg-destructive/5 text-foreground'
                    : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="timeframe"
                    value="all"
                    checked={timeframe === 'all'}
                    onChange={() => setTimeframe('all')}
                    className="text-destructive focus:ring-destructive"
                  />
                  <div>
                    <span className="text-xs font-bold block text-destructive">Toàn bộ lịch sử đọc</span>
                    <span className="text-[11px] text-muted-foreground">Xoá sạch toàn bộ tiến độ các bài đã đọc</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Huỷ bỏ
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleClear}
                disabled={isLoading}
                className="gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xoá...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Xác nhận xoá</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
