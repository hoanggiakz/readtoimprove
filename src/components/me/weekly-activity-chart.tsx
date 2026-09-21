'use client';

import React from 'react';
import { DailyReadActivity } from '@/lib/queries/user-stats';

interface WeeklyActivityChartProps {
  activity: DailyReadActivity[];
}

export function WeeklyActivityChart({ activity }: WeeklyActivityChartProps) {
  const maxVal = Math.max(1, ...activity.map((a) => a.count));
  // Chart geometry constants
  const chartHeight = 160;
  const barWidth = 32;
  const gap = 20;
  const totalWidth = activity.length * (barWidth + gap);

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">Hoạt động 7 ngày gần nhất</h4>
        <span className="text-xs text-muted-foreground">
          Tổng:{' '}
          <strong className="text-foreground">
            {activity.reduce((acc, curr) => acc + curr.count, 0)} bài
          </strong>
        </span>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-xs">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`}
          className="w-full h-44 select-none overflow-visible"
          role="img"
          aria-label="Biểu đồ số bài đọc trong 7 ngày gần nhất"
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight}
            x2={totalWidth}
            y2={chartHeight}
            stroke="currentColor"
            className="text-border"
            strokeWidth="1"
          />

          {activity.map((item, index) => {
            const x = index * (barWidth + gap) + 10;
            const barHeight = item.count > 0 ? Math.max(8, (item.count / maxVal) * (chartHeight - 30)) : 4;
            const y = chartHeight - barHeight;
            const isToday = index === activity.length - 1;

            return (
              <g key={item.date} className="group cursor-pointer">
                {/* Background column highlight on hover */}
                <rect
                  x={x - 6}
                  y={10}
                  width={barWidth + 12}
                  height={chartHeight - 10}
                  rx="6"
                  className="fill-muted/0 group-hover:fill-muted/40 transition-colors"
                />

                {/* Animated bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  fill={isToday && item.count > 0 ? 'url(#activeBarGradient)' : 'url(#barGradient)'}
                  className="transition-all duration-300 group-hover:opacity-90"
                />

                {/* Count label above bar */}
                {item.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-foreground"
                  >
                    {item.count}
                  </text>
                )}

                {/* Day of week label below axis */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  className={`text-xs font-semibold ${
                    isToday ? 'fill-primary font-bold' : 'fill-muted-foreground'
                  }`}
                >
                  {item.label}
                </text>

                {/* Full date caption */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 32}
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground/70"
                >
                  {item.fullDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
