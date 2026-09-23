import { describe, it, expect } from "vitest";
import { getCefrInfo, CEFR_METADATA, CefrLevel } from "@/lib/cefr";

describe("cefr Metadata & Helper Suite", () => {
  // TC-CEFR-01: All valid CEFR levels resolved
  it("TC-CEFR-01: resolves all standard CEFR levels (A1 to C2) with accurate labels", () => {
    expect(getCefrInfo("A1").label).toBe("Beginner");
    expect(getCefrInfo("A2").label).toBe("Elementary");
    expect(getCefrInfo("B1").label).toBe("Intermediate");
    expect(getCefrInfo("B2").label).toBe("Upper Intermediate");
    expect(getCefrInfo("C1").label).toBe("Advanced");
    expect(getCefrInfo("C2").label).toBe("Proficiency");
  });

  // TC-CEFR-02: Lowercase handling
  it("TC-CEFR-02: normalizes lowercase level strings correctly", () => {
    expect(getCefrInfo("b1").level).toBe("B1");
    expect(getCefrInfo("c2").level).toBe("C2");
  });

  // TC-CEFR-03: Fallback on null or undefined
  it("TC-CEFR-03: falls back to B2 on null or undefined input", () => {
    expect(getCefrInfo(null).level).toBe("B2");
    expect(getCefrInfo(undefined).level).toBe("B2");
  });

  // TC-CEFR-04: Fallback on unknown string
  it("TC-CEFR-04: falls back to B2 on unrecognized level strings", () => {
    expect(getCefrInfo("D1").level).toBe("B2");
    expect(getCefrInfo("UNKNOWN").level).toBe("B2");
  });

  // TC-CEFR-05: Dark mode tokens in badgeClasses
  it("TC-CEFR-05: provides dual-theme badgeClasses for all levels", () => {
    const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    levels.forEach((lvl) => {
      const info = CEFR_METADATA[lvl];
      expect(info.badgeClasses).toContain("dark:");
      expect(info.highlightClasses).toContain("hover:");
    });
  });

  // TC-CEFR-06: Non-empty descriptions
  it("TC-CEFR-06: provides meaningful descriptions for every level", () => {
    const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
    levels.forEach((lvl) => {
      expect(CEFR_METADATA[lvl].description.length).toBeGreaterThan(10);
    });
  });
});
