import { describe, it, expect } from "vitest";
import { sliceSentenceText, HighlightMetadata } from "@/lib/sentence-slicer";
import { CefrLevel } from "@prisma/client";

describe("sentence-slicer Pure Algorithm Suite", () => {
  const mockVocab = {
    id: "v1",
    word: "sustainable",
    meaningVi: "bền vững",
    cefrLevel: CefrLevel.B2,
  };

  // TC-SLICE-01: Empty sentence
  it("TC-SLICE-01: returns empty array when given empty sentence text", () => {
    expect(sliceSentenceText("")).toEqual([]);
  });

  // TC-SLICE-02: Sentence without highlights
  it("TC-SLICE-02: returns single non-highlight slice when no highlights provided", () => {
    const text = "Vietnam is developing renewable energy infrastructure.";
    const slices = sliceSentenceText(text, []);
    expect(slices).toHaveLength(1);
    expect(slices[0]).toEqual({ text, isHighlight: false });
  });

  // TC-SLICE-03: Highlight at start
  it("TC-SLICE-03: slices highlight at start of sentence correctly", () => {
    const text = "Clean energy is the future.";
    const highlights: HighlightMetadata[] = [
      { startOffset: 0, endOffset: 12, highlightedText: "Clean energy", vocabulary: mockVocab },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices).toHaveLength(2);
    expect(slices[0].isHighlight).toBe(true);
    expect(slices[0].text).toBe("Clean energy");
    expect(slices[1].isHighlight).toBe(false);
    expect(slices[1].text).toBe(" is the future.");
    expect(slices.map((s) => s.text).join("")).toBe(text);
  });

  // TC-SLICE-04: Highlight in middle
  it("TC-SLICE-04: slices highlight in middle of sentence into 3 slices", () => {
    const text = "Cities need sustainable infrastructure today.";
    // "sustainable" is at offset 12..23
    const start = text.indexOf("sustainable");
    const end = start + "sustainable".length;
    const highlights: HighlightMetadata[] = [
      { startOffset: start, endOffset: end, highlightedText: "sustainable", vocabulary: mockVocab },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices).toHaveLength(3);
    expect(slices[0].text).toBe("Cities need ");
    expect(slices[1].text).toBe("sustainable");
    expect(slices[1].isHighlight).toBe(true);
    expect(slices[2].text).toBe(" infrastructure today.");
    expect(slices.map((s) => s.text).join("")).toBe(text);
  });

  // TC-SLICE-05: Highlight at end
  it("TC-SLICE-05: slices highlight at the very end of sentence", () => {
    const text = "Energy should be sustainable";
    const start = text.indexOf("sustainable");
    const end = text.length;
    const slices = sliceSentenceText(text, [
      { startOffset: start, endOffset: end, highlightedText: "sustainable", vocabulary: mockVocab },
    ]);
    expect(slices).toHaveLength(2);
    expect(slices[0].text).toBe("Energy should be ");
    expect(slices[1].text).toBe("sustainable");
    expect(slices[1].isHighlight).toBe(true);
    expect(slices.map((s) => s.text).join("")).toBe(text);
  });

  // TC-SLICE-06: Multiple non-overlapping highlights
  it("TC-SLICE-06: handles multiple non-overlapping highlights in order", () => {
    const text = "Solar and wind are clean energy sources.";
    const highlights: HighlightMetadata[] = [
      { startOffset: 0, endOffset: 5, highlightedText: "Solar", vocabulary: mockVocab },
      { startOffset: 10, endOffset: 14, highlightedText: "wind", vocabulary: mockVocab },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices.map((s) => s.text).join("")).toBe(text);
    expect(slices.filter((s) => s.isHighlight)).toHaveLength(2);
  });

  // TC-SLICE-07: Overlapping highlights skipping
  it("TC-SLICE-07: skips overlapping secondary highlight to prevent duplicate characters", () => {
    const text = "Clean energy solutions.";
    // Highlight 1: "Clean energy" (0..12)
    // Highlight 2: "energy solutions" (6..22) -> overlaps!
    const highlights: HighlightMetadata[] = [
      { startOffset: 0, endOffset: 12, highlightedText: "Clean energy", vocabulary: mockVocab },
      { startOffset: 6, endOffset: 22, highlightedText: "energy solutions", vocabulary: mockVocab },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices.filter((s) => s.isHighlight)).toHaveLength(1);
    expect(slices[0].text).toBe("Clean energy");
    expect(slices.map((s) => s.text).join("")).toBe(text);
  });

  // TC-SLICE-08: Out-of-bounds offset safety
  it("TC-SLICE-08: discards invalid, negative, or out-of-bounds offsets safely", () => {
    const text = "Sample sentence text.";
    const invalidHighlights: HighlightMetadata[] = [
      { startOffset: -5, endOffset: 5, highlightedText: "Invalid" },
      { startOffset: 10, endOffset: 50, highlightedText: "Exceeds length" },
      { startOffset: 15, endOffset: 10, highlightedText: "Inverted" },
    ];
    const slices = sliceSentenceText(text, invalidHighlights);
    expect(slices).toHaveLength(1);
    expect(slices[0].text).toBe(text);
  });

  // TC-SLICE-09: 100% character identity guarantee
  it("TC-SLICE-09: guarantees 100% character preservation with unicode & punctuation", () => {
    const text = "Hà Nội — thành phố năng động với 100% năng lượng xanh: “bền vững” & tương lai!";
    const highlights: HighlightMetadata[] = [
      { startOffset: 0, endOffset: 6, highlightedText: "Hà Nội" },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices.map((s) => s.text).join("")).toBe(text);
  });

  // TC-SLICE-10: Unsorted highlights automatically sorted
  it("TC-SLICE-10: sorts highlights by startOffset ASC automatically", () => {
    const text = "Alpha Beta Gamma Delta";
    const highlights: HighlightMetadata[] = [
      { startOffset: 11, endOffset: 16, highlightedText: "Gamma" },
      { startOffset: 0, endOffset: 5, highlightedText: "Alpha" },
    ];
    const slices = sliceSentenceText(text, highlights);
    expect(slices.map((s) => s.text).join("")).toBe(text);
    expect(slices[0].text).toBe("Alpha");
    expect(slices[0].isHighlight).toBe(true);
  });
});
