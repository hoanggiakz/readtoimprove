import { CefrLevel } from '@prisma/client';

export interface VocabularyDetailDTO {
  id: string;
  word: string;
  normalizedLemma?: string | null;
  ipa?: string | null;
  pos?: string | null;
  meaningVi: string;
  exampleEn?: string | null;
  exampleVi?: string | null;
  cefrLevel: CefrLevel;
  audioUrl?: string | null;
}

export interface HighlightMetadata {
  id?: string;
  startOffset: number;
  endOffset: number;
  highlightedText?: string | null;
  vocabulary?: VocabularyDetailDTO | null;
}

export interface SentenceSlice {
  text: string;
  isHighlight: boolean;
  highlight?: HighlightMetadata;
}

/**
 * Validates and slices a sentence's English text into renderable segments based on vocabulary offsets.
 *
 * Enforces strict bounds:
 *   0 <= startOffset < endOffset <= textEn.length
 *
 * Overlapping highlight strategy:
 *   Highlights are sorted by startOffset ASC, then endOffset ASC.
 *   The first valid non-overlapping highlight is accepted. Any secondary highlight whose startOffset
 *   falls before the current index is skipped.
 *
 * Guarantee:
 *   slices.map(s => s.text).join('') === textEn
 *   Original character sequence, casing, whitespace, and punctuation are 100% preserved.
 */
export function sliceSentenceText(
  textEn: string,
  highlights: HighlightMetadata[] = []
): SentenceSlice[] {
  if (!textEn || textEn.length === 0) {
    return [];
  }

  if (!highlights || highlights.length === 0) {
    return [{ text: textEn, isHighlight: false }];
  }

  // 1. Filter valid highlights within bounds
  const validHighlights = highlights.filter((h) => {
    if (typeof h.startOffset !== 'number' || typeof h.endOffset !== 'number') {
      return false;
    }
    if (h.startOffset < 0) return false;
    if (h.startOffset >= h.endOffset) return false;
    if (h.endOffset > textEn.length) return false;
    return true;
  });

  if (validHighlights.length === 0) {
    return [{ text: textEn, isHighlight: false }];
  }

  // 2. Sort deterministically: startOffset ASC, then endOffset ASC
  validHighlights.sort((a, b) => {
    if (a.startOffset !== b.startOffset) {
      return a.startOffset - b.startOffset;
    }
    return a.endOffset - b.endOffset;
  });

  // 3. Slicing with overlap rejection
  const slices: SentenceSlice[] = [];
  let currentIndex = 0;

  for (const h of validHighlights) {
    // If this highlight starts before or at the current index, it overlaps with an accepted range -> skip
    if (h.startOffset < currentIndex) {
      continue;
    }

    // Append preceding non-highlighted text
    if (h.startOffset > currentIndex) {
      slices.push({
        text: textEn.slice(currentIndex, h.startOffset),
        isHighlight: false,
      });
    }

    // Append the highlighted token
    slices.push({
      text: textEn.slice(h.startOffset, h.endOffset),
      isHighlight: true,
      highlight: h,
    });

    currentIndex = h.endOffset;
  }

  // Append remaining trailing text
  if (currentIndex < textEn.length) {
    slices.push({
      text: textEn.slice(currentIndex),
      isHighlight: false,
    });
  }

  return slices;
}
