import * as React from "react";
import { CefrLevel } from "@prisma/client";
import { getCefrInfo } from "@/lib/cefr";
import { cn } from "@/lib/utils";

interface CefrBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: CefrLevel | string;
  showLabel?: boolean;
}

export function CefrBadge({ level, showLabel = false, className, ...props }: CefrBadgeProps) {
  const info = getCefrInfo(level);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border transition-colors",
        info.badgeClasses,
        className
      )}
      {...props}
    >
      <span>{info.level}</span>
      {showLabel && <span className="font-sans font-normal opacity-80">({info.label})</span>}
    </span>
  );
}
