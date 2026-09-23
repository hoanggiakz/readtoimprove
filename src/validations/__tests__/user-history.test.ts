import { describe, it, expect } from "vitest";
import {
  recordProgressSchema,
  clearHistorySchema,
  updateGoalSchema,
  syncGuestHistorySchema,
  historyQuerySchema,
} from "@/validations/user-history";
import { CefrLevel } from "@prisma/client";

describe("User History Validation Schemas", () => {
  // TC-VAL-HIST-01: recordProgressSchema valid
  it("TC-VAL-HIST-01: validates recordProgressSchema within 0-100 bounds", () => {
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: 50 }).success).toBe(true);
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: 0 }).success).toBe(true);
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: 100 }).success).toBe(true);
  });

  // TC-VAL-HIST-02: recordProgressSchema rejects out of bounds
  it("TC-VAL-HIST-02: rejects readPercentage outside 0-100 bounds or non-integer", () => {
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: -1 }).success).toBe(false);
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: 101 }).success).toBe(false);
    expect(recordProgressSchema.safeParse({ articleId: "art-1", readPercentage: 45.5 }).success).toBe(false);
  });

  // TC-VAL-HIST-03: clearHistorySchema requires articleId or timeframe
  it("TC-VAL-HIST-03: validates clearHistorySchema refinement condition", () => {
    expect(clearHistorySchema.safeParse({ articleId: "art-1" }).success).toBe(true);
    expect(clearHistorySchema.safeParse({ timeframe: "7d" }).success).toBe(true);
    expect(clearHistorySchema.safeParse({}).success).toBe(false);
  });

  // TC-VAL-HIST-04: updateGoalSchema validates 1-50 range
  it("TC-VAL-HIST-04: enforces weekly reading goal boundaries (1 to 50)", () => {
    expect(updateGoalSchema.safeParse({ weeklyGoal: 5 }).success).toBe(true);
    expect(updateGoalSchema.safeParse({ weeklyGoal: 0 }).success).toBe(false);
    expect(updateGoalSchema.safeParse({ weeklyGoal: 51 }).success).toBe(false);
  });

  // TC-VAL-HIST-05: syncGuestHistorySchema validates array bounds
  it("TC-VAL-HIST-05: validates guest history items array and enforces max 100 items", () => {
    const valid = {
      items: [{ articleId: "art-1", readPercentage: 80, lastReadAt: "2026-01-01" }],
    };
    expect(syncGuestHistorySchema.safeParse(valid).success).toBe(true);

    const oversized = {
      items: Array(101).fill({ articleId: "art-1", readPercentage: 80 }),
    };
    expect(syncGuestHistorySchema.safeParse(oversized).success).toBe(false);
  });

  // TC-VAL-HIST-06: historyQuerySchema validates pagination and filters
  it("TC-VAL-HIST-06: parses history query parameters with CEFR and pagination", () => {
    const valid = historyQuerySchema.safeParse({
      page: "2",
      limit: "15",
      category: "tech",
      level: CefrLevel.C1,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.page).toBe(2);
      expect(valid.data.limit).toBe(15);
    }
  });
});
