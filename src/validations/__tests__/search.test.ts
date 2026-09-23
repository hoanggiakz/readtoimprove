import { describe, it, expect } from "vitest";
import { searchParamsSchema, suggestionsQuerySchema } from "@/validations/search";
import { CefrLevel } from "@prisma/client";

describe("Search Validation Schemas", () => {
  // TC-VAL-SEARCH-01: searchParamsSchema defaults
  it("TC-VAL-SEARCH-01: parses valid query options and assigns defaults", () => {
    const result = searchParamsSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(12);
    }
  });

  // TC-VAL-SEARCH-02: searchParamsSchema rejects oversized query
  it("TC-VAL-SEARCH-02: rejects search terms exceeding 100 characters", () => {
    const result = searchParamsSchema.safeParse({ q: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  // TC-VAL-SEARCH-03: searchParamsSchema validates CEFR enum
  it("TC-VAL-SEARCH-03: validates CEFR level enum correctly", () => {
    const valid = searchParamsSchema.safeParse({ level: CefrLevel.B2 });
    expect(valid.success).toBe(true);

    const invalid = searchParamsSchema.safeParse({ level: "UNKNOWN" as any });
    expect(invalid.success).toBe(false);
  });

  // TC-VAL-SEARCH-04: searchParamsSchema clamps page and limit
  it("TC-VAL-SEARCH-04: rejects negative page number and clamps max limit", () => {
    const invalidPage = searchParamsSchema.safeParse({ page: 0 });
    expect(invalidPage.success).toBe(false);

    const invalidLimit = searchParamsSchema.safeParse({ limit: 51 });
    expect(invalidLimit.success).toBe(false);
  });

  // TC-VAL-SEARCH-05: suggestionsQuerySchema enforces min 2 chars
  it("TC-VAL-SEARCH-05: parses valid suggestions query with >= 2 chars", () => {
    const result = suggestionsQuerySchema.safeParse({ q: "en" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("en");
    }
  });

  // TC-VAL-SEARCH-06: suggestionsQuerySchema rejects short query
  it("TC-VAL-SEARCH-06: rejects single character or empty suggestion query", () => {
    expect(suggestionsQuerySchema.safeParse({ q: "e" }).success).toBe(false);
    expect(suggestionsQuerySchema.safeParse({ q: "  " }).success).toBe(false);
  });
});
