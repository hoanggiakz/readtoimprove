import React from 'react';
import Link from 'next/link';
import { CEFR_METADATA, CefrLevel } from '@/lib/cefr';
import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';

interface CefrSelectorProps {
  currentLevel?: string;
  baseUrl?: string;
  className?: string;
}

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function CefrSelector({
  currentLevel,
  baseUrl = '/articles',
  className,
}: CefrSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span>Trình độ CEFR</span>
        </div>
        {currentLevel && (
          <Link
            href={baseUrl}
            className="text-xs text-primary hover:underline font-medium"
          >
            Tất cả trình độ
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {CEFR_LEVELS.map((lvl) => {
          const info = CEFR_METADATA[lvl];
          const isActive = currentLevel?.toUpperCase() === lvl;

          return (
            <Link
              key={lvl}
              href={`${baseUrl}?level=${lvl}`}
              className={cn(
                'group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                  : 'bg-card text-foreground/80 border-border/80 hover:border-primary/50 hover:bg-muted/50'
              )}
            >
              <span className="font-mono font-bold">{lvl}</span>
              <span
                className={cn(
                  'text-[11px] hidden sm:inline transition-opacity',
                  isActive ? 'opacity-90' : 'text-muted-foreground group-hover:text-foreground'
                )}
              >
                {info.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
