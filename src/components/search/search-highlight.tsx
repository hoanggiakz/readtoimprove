import React from 'react';
import { cn } from '@/lib/utils';

interface SearchHighlightProps {
  text: string;
  query?: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Escapes regex special characters to prevent RegExp injection.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Safe, accessible keyword highlighter.
 * Splits text into matched and unmatched segments using regex tokenization.
 * 100% immune to XSS injection because it renders native React text nodes
 * and does NOT use dangerouslySetInnerHTML.
 */
export function SearchHighlight({
  text,
  query,
  className,
  highlightClassName,
}: SearchHighlightProps) {
  if (!query || query.trim().length < 2) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim();
  const escaped = escapeRegex(cleanQuery);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
        if (isMatch) {
          return (
            <mark
              key={index}
              className={cn(
                'bg-primary/20 text-primary font-medium rounded-sm px-0.5 transition-colors',
                highlightClassName
              )}
            >
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
