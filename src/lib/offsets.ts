/**
 * Offset Calculation & Highlight Validation Engine
 *
 * Provides deterministic zero-based character index operations for bilingual sentences.
 * Avoids brittle regular expression replacements at runtime.
 */

export interface HighlightValidationResult {
  valid: boolean;
  error?: string;
  extractedText: string;
  startOffset: number;
  endOffset: number;
}

export interface WordOffsetMatch {
  startOffset: number;
  endOffset: number;
  slice: string;
}

/**
 * Validates that character offsets fall strictly within sentence bounds
 * and match the expected substring slice.
 */
export function validateHighlightOffsets(
  textEn: string,
  startOffset: number,
  endOffset: number,
  expectedText?: string
): HighlightValidationResult {
  if (startOffset < 0) {
    return {
      valid: false,
      error: `startOffset (${startOffset}) must be non-negative (>= 0).`,
      extractedText: "",
      startOffset,
      endOffset,
    };
  }

  if (endOffset > textEn.length) {
    return {
      valid: false,
      error: `endOffset (${endOffset}) exceeds sentence length (${textEn.length}).`,
      extractedText: "",
      startOffset,
      endOffset,
    };
  }

  if (startOffset >= endOffset) {
    return {
      valid: false,
      error: `startOffset (${startOffset}) must be strictly less than endOffset (${endOffset}).`,
      extractedText: "",
      startOffset,
      endOffset,
    };
  }

  const extractedText = textEn.slice(startOffset, endOffset);

  if (expectedText && extractedText !== expectedText) {
    return {
      valid: false,
      error: `Slice mismatch: extracted '${extractedText}' but expected '${expectedText}'.`,
      extractedText,
      startOffset,
      endOffset,
    };
  }

  return {
    valid: true,
    extractedText,
    startOffset,
    endOffset,
  };
}

/**
 * Locates all occurrences of a search word/phrase within a sentence string,
 * returning exact character coordinates for user selection.
 */
export function findWordOffsets(textEn: string, searchWord: string): WordOffsetMatch[] {
  if (!searchWord || !textEn) return [];

  const matches: WordOffsetMatch[] = [];
  const lowerText = textEn.toLowerCase();
  const lowerSearch = searchWord.trim().toLowerCase();

  if (lowerSearch.length === 0) return [];

  let startIndex = 0;
  while (startIndex < textEn.length) {
    const foundIndex = lowerText.indexOf(lowerSearch, startIndex);
    if (foundIndex === -1) break;

    const endIndex = foundIndex + lowerSearch.length;
    matches.push({
      startOffset: foundIndex,
      endOffset: endIndex,
      slice: textEn.slice(foundIndex, endIndex),
    });

    startIndex = foundIndex + 1;
  }

  return matches;
}
