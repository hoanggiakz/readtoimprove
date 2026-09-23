import { describe, it, expect } from "vitest";
import { findWordOffsets, validateHighlightOffsets } from "@/lib/offsets";

describe("offsets Calculation & Validation Suite", () => {
  // TC-OFF-01: findWordOffsets single match
  it("TC-OFF-01: locates exact coordinates for a single word occurrence", () => {
    const text = "Renewable energy is sustainable.";
    const matches = findWordOffsets(text, "sustainable");
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      startOffset: 20,
      endOffset: 31,
      slice: "sustainable",
    });
  });

  // TC-OFF-02: findWordOffsets multiple matches & case preservation
  it("TC-OFF-02: finds multiple occurrences and preserves original slice casing", () => {
    const text = "Energy is life. Clean ENERGY powers the future.";
    const matches = findWordOffsets(text, "energy");
    expect(matches).toHaveLength(2);
    expect(matches[0].slice).toBe("Energy");
    expect(matches[1].slice).toBe("ENERGY");
  });

  // TC-OFF-03: findWordOffsets empty inputs
  it("TC-OFF-03: returns empty array when given blank text or search word", () => {
    expect(findWordOffsets("", "word")).toEqual([]);
    expect(findWordOffsets("Some text", "")).toEqual([]);
    expect(findWordOffsets("Some text", "   ")).toEqual([]);
  });

  // TC-OFF-04: validateHighlightOffsets valid match
  it("TC-OFF-04: successfully validates matching highlight offsets", () => {
    const text = "Vietnam's green transition";
    const result = validateHighlightOffsets(text, 10, 15, "green");
    expect(result.valid).toBe(true);
    expect(result.extractedText).toBe("green");
  });

  // TC-OFF-05: validateHighlightOffsets out-of-bounds
  it("TC-OFF-05: rejects negative startOffset or endOffset exceeding sentence length", () => {
    const text = "Short text";
    const negResult = validateHighlightOffsets(text, -1, 5);
    expect(negResult.valid).toBe(false);
    expect(negResult.error).toContain("startOffset (-1) must be non-negative");

    const exceedResult = validateHighlightOffsets(text, 0, 50);
    expect(exceedResult.valid).toBe(false);
    expect(exceedResult.error).toContain("exceeds sentence length");

    const invertResult = validateHighlightOffsets(text, 5, 2);
    expect(invertResult.valid).toBe(false);
    expect(invertResult.error).toContain("strictly less than endOffset");
  });

  // TC-OFF-06: validateHighlightOffsets slice mismatch
  it("TC-OFF-06: rejects slice mismatch against expectedText", () => {
    const text = "Clean energy solutions";
    const mismatch = validateHighlightOffsets(text, 0, 5, "Green");
    expect(mismatch.valid).toBe(false);
    expect(mismatch.error).toContain("Slice mismatch: extracted 'Clean' but expected 'Green'");
  });
});
