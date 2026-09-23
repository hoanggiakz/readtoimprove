import { describe, it, expect, vi } from "vitest";
import { formatDateInTimezone, calculateStreaks, getUserStats } from "@/lib/queries/user-stats";

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    readingHistory: {
      findMany: vi.fn().mockResolvedValue([
        {
          lastReadAt: new Date(),
          readPercentage: 80,
          article: { readingTimeMinutes: 5 },
        },
      ]),
      count: vi.fn().mockResolvedValue(5),
    },
    userReadingGoal: {
      findUnique: vi.fn().mockResolvedValue({ weeklyArticleGoal: 10 }),
    },
    userSavedVocabulary: {
      count: vi.fn().mockResolvedValue(15),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("user-stats Streak & Timezone Calculation Engine", () => {
  const VN_TZ = "Asia/Ho_Chi_Minh";

  // TC-BUS-STAT-01: Timezone boundary shift (+7 hours)
  it("TC-BUS-STAT-01: shifts UTC evening timestamps into next calendar day in Vietnam (+7h)", () => {
    // 2026-09-21 18:00:00 UTC is 2026-09-22 01:00:00 in Vietnam
    const utcEvening = new Date("2026-09-21T18:00:00Z");
    expect(formatDateInTimezone(utcEvening, VN_TZ)).toBe("2026-09-22");
  });

  // TC-BUS-STAT-02: Invalid timezone fallback
  it("TC-BUS-STAT-02: falls back to UTC slice gracefully on invalid timezone identifier", () => {
    const d = new Date("2026-05-15T12:00:00Z");
    const result = formatDateInTimezone(d, "Invalid/TimeZone_X");
    expect(result).toBe("2026-05-15");
  });

  // TC-BUS-STAT-03: Empty dates array
  it("TC-BUS-STAT-03: returns zero streak when user has zero reading history", () => {
    const result = calculateStreaks([], VN_TZ);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, hasReadToday: false });
  });

  // TC-BUS-STAT-04: Read today only
  it("TC-BUS-STAT-04: computes streak of 1 day when read today", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const today = new Date("2026-09-23T08:00:00Z");
    const result = calculateStreaks([today], VN_TZ, now);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.hasReadToday).toBe(true);
  });

  // TC-BUS-STAT-05: Read yesterday only (streak preserved)
  it("TC-BUS-STAT-05: preserves streak of 1 day if read yesterday but not today", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const yesterday = new Date("2026-09-22T10:00:00Z");
    const result = calculateStreaks([yesterday], VN_TZ, now);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.hasReadToday).toBe(false);
  });

  // TC-BUS-STAT-06: Multi-day consecutive streak ending today
  it("TC-BUS-STAT-06: calculates consecutive multi-day streak ending today", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      new Date("2026-09-21T10:00:00Z"),
      new Date("2026-09-22T10:00:00Z"),
      new Date("2026-09-23T08:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.hasReadToday).toBe(true);
  });

  // TC-BUS-STAT-07: Multi-day consecutive streak ending yesterday
  it("TC-BUS-STAT-07: preserves active streak when read 3 days in a row ending yesterday", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      new Date("2026-09-20T10:00:00Z"),
      new Date("2026-09-21T10:00:00Z"),
      new Date("2026-09-22T10:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(3);
    expect(result.hasReadToday).toBe(false);
  });

  // TC-BUS-STAT-08: Streak reset on 2-day gap
  it("TC-BUS-STAT-08: resets current streak to 0 when last read was 2 days ago", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      new Date("2026-09-19T10:00:00Z"),
      new Date("2026-09-20T10:00:00Z"),
      new Date("2026-09-21T10:00:00Z"), // gap on 22nd & 23rd
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
    expect(result.hasReadToday).toBe(false);
  });

  // TC-BUS-STAT-09: Multiple reads on same day
  it("TC-BUS-STAT-09: collapses multiple reads on the same calendar day into a single streak day", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      new Date("2026-09-23T01:00:00Z"),
      new Date("2026-09-23T05:00:00Z"),
      new Date("2026-09-23T08:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  // TC-BUS-STAT-10: Longest streak independent of current streak
  it("TC-BUS-STAT-10: preserves historical longest streak when current streak is lower", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      // Past 4-day streak
      new Date("2026-09-01T10:00:00Z"),
      new Date("2026-09-02T10:00:00Z"),
      new Date("2026-09-03T10:00:00Z"),
      new Date("2026-09-04T10:00:00Z"),
      // Gap
      // Current 2-day streak
      new Date("2026-09-22T10:00:00Z"),
      new Date("2026-09-23T10:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(4);
  });

  // TC-BUS-STAT-11: Month boundary crossing
  it("TC-BUS-STAT-11: maintains streak continuity across month boundaries", () => {
    const now = new Date("2026-03-02T10:00:00Z");
    const dates = [
      new Date("2026-02-28T10:00:00Z"),
      new Date("2026-03-01T10:00:00Z"),
      new Date("2026-03-02T10:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(3);
  });

  // TC-BUS-STAT-12: Unsorted dates array
  it("TC-BUS-STAT-12: handles arbitrary unsorted timestamp arrays accurately", () => {
    const now = new Date("2026-09-23T10:00:00Z");
    const dates = [
      new Date("2026-09-23T08:00:00Z"),
      new Date("2026-09-21T10:00:00Z"),
      new Date("2026-09-22T10:00:00Z"),
    ];
    const result = calculateStreaks(dates, VN_TZ, now);
    expect(result.currentStreak).toBe(3);
  });

  // TC-BUS-STAT-13: Full user dashboard stats query
  it("TC-BUS-STAT-13: computes full dashboard user statistics with weekly goals and streaks", async () => {
    const stats = await getUserStats("user-1", VN_TZ);
    expect(stats.totalArticlesRead).toBe(5);
    expect(stats.savedWordsCount).toBe(15);
    expect(stats.weeklyGoal.target).toBe(10);
    expect(stats.weeklyActivity.length).toBe(7);
    expect(stats.weeklyGoal.percentage).toBe(50); // 5 / 10 * 100%
  });
});
