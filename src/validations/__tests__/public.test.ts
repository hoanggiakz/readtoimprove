import { describe, it, expect } from "vitest";
import { publicArticlesQuerySchema } from "@/validations/public";
import { CefrLevel } from "@prisma/client";

describe("Public Articles Query Validation Suite", () => {
  it("TC-VAL-PUB-01: parses valid query with default page", () => {
    const result = publicArticlesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.q).toBeUndefined();
    }
  });

  it("TC-VAL-PUB-02: transforms query under 2 characters to undefined", () => {
    const result = publicArticlesQuerySchema.safeParse({ q: "a" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBeUndefined();
    }
  });

  it("TC-VAL-PUB-03: accepts valid search query and category", () => {
    const result = publicArticlesQuerySchema.safeParse({
      q: "technology",
      category: "science",
      level: "B2",
      page: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("technology");
      expect(result.data.category).toBe("science");
      expect(result.data.level).toBe(CefrLevel.B2);
      expect(result.data.page).toBe(3);
    }
  });

  it("TC-VAL-PUB-04: catches invalid cefr level and falls back to undefined", () => {
    const result = publicArticlesQuerySchema.safeParse({ level: "INVALID_LEVEL" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level).toBeUndefined();
    }
  });

  it("TC-VAL-PUB-05: catches invalid page and falls back to default 1", () => {
    const result = publicArticlesQuerySchema.safeParse({ page: "-5" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });
});
