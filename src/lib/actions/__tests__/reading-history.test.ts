import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  recordReadingProgressAction,
  clearReadingHistoryAction,
  syncGuestHistoryAction,
} from "@/lib/actions/reading-history";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock rate-limit
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock audit-log
vi.mock("@/lib/audit-log", () => ({
  auditLog: vi.fn().mockResolvedValue({}),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    article: {
      findUnique: vi.fn().mockResolvedValue({ id: "art-1", status: "PUBLISHED" }),
    },
    readingHistory: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ readPercentage: 50, completed: false }),
      update: vi.fn().mockResolvedValue({ readPercentage: 80, completed: false }),
      upsert: vi.fn().mockImplementation((args: any) =>
        Promise.resolve({
          id: "hist-1",
          readPercentage: args.create.readPercentage,
          completed: args.create.completed,
        })
      ),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { auth } from "@/lib/auth";

describe("reading-history Server Actions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-ACT-HIST-01: Unauthenticated rejection
  it("TC-ACT-HIST-01: rejects unauthenticated user with UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 50 });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-HIST-02: Invalid input rejection
  it("TC-ACT-HIST-02: rejects invalid percentage boundaries with INVALID_INPUT", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 150 });
    expect(result.success).toBe(false);
    expect(result.error).toBe("INVALID_INPUT");
  });

  // TC-ACT-HIST-03: Initial progress creation
  it("TC-ACT-HIST-03: creates initial reading progress record below completion threshold", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce(null);

    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 45 });
    expect(result.success).toBe(true);
    expect(result.data?.completed).toBe(false);
    expect(result.data?.readPercentage).toBe(45);
  });

  // TC-ACT-HIST-04: Monotonic progress preservation
  it("TC-ACT-HIST-04: preserves higher existing progress when new progress is lower (monotonic update)", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce({
      id: "hist-1",
      userId: "user-1",
      articleId: "art-1",
      readPercentage: 75,
      completed: false,
    } as any);

    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 30 });
    expect(result.success).toBe(true);
    expect(result.data?.readPercentage).toBe(75);
  });

  // TC-ACT-HIST-05: Automatic completion at >= 90%
  it("TC-ACT-HIST-05: marks article as completed automatically when progress reaches >= 90%", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce({
      id: "hist-1",
      userId: "user-1",
      articleId: "art-1",
      readPercentage: 60,
      completed: false,
    } as any);

    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 92 });
    expect(result.success).toBe(true);
    expect(result.data?.completed).toBe(true);
    expect(result.data?.readPercentage).toBe(92);
  });

  // TC-ACT-HIST-06: Preserves completion status
  it("TC-ACT-HIST-06: maintains completed: true even if current scroll position is lower", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce({
      id: "hist-1",
      userId: "user-1",
      articleId: "art-1",
      readPercentage: 100,
      completed: true,
    } as any);

    const result = await recordReadingProgressAction({ articleId: "art-1", readPercentage: 20 });
    expect(result.success).toBe(true);
    expect(result.data?.completed).toBe(true);
    expect(result.data?.readPercentage).toBe(100);
  });

  // TC-ACT-HIST-07: Clear history requires authentication
  it("TC-ACT-HIST-07: clearReadingHistoryAction rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await clearReadingHistoryAction({ articleId: "art-1" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-HIST-08: Clear history executes deleteMany
  it("TC-ACT-HIST-08: clearReadingHistoryAction deletes history records for authenticated user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const result = await clearReadingHistoryAction({ articleId: "art-1" });
    expect(result.success).toBe(true);
    expect(mockPrisma.readingHistory.deleteMany).toHaveBeenCalled();
  });

  // TC-ACT-HIST-09: Clear history by timeframe
  it("TC-ACT-HIST-09: clearReadingHistoryAction supports 7d, 30d, and all timeframes", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const res7d = await clearReadingHistoryAction({ timeframe: "7d" });
    expect(res7d.success).toBe(true);

    const res30d = await clearReadingHistoryAction({ timeframe: "30d" });
    expect(res30d.success).toBe(true);

    const resAll = await clearReadingHistoryAction({ timeframe: "all" });
    expect(resAll.success).toBe(true);
  });

  // TC-ACT-HIST-10: Sync guest history requires authentication
  it("TC-ACT-HIST-10: syncGuestHistoryAction rejects unauthenticated callers", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await syncGuestHistoryAction({ items: [] });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-HIST-11: Sync guest history empty items
  it("TC-ACT-HIST-11: syncGuestHistoryAction handles empty array without processing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const result = await syncGuestHistoryAction({ items: [] });
    expect(result.success).toBe(true);
    expect(result.data?.syncedCount).toBe(0);
  });

  // TC-ACT-HIST-12: Sync guest history with items
  it("TC-ACT-HIST-12: syncGuestHistoryAction synchronizes guest progress items into user history", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.article.findUnique.mockResolvedValueOnce({ id: "art-1" } as any);
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce(null as any);

    const result = await syncGuestHistoryAction({
      items: [{ articleId: "art-1", readPercentage: 85, lastReadAt: new Date().toISOString() }],
    });
    expect(result.success).toBe(true);
    expect(result.data?.syncedCount).toBe(1);
    expect(mockPrisma.readingHistory.upsert).toHaveBeenCalled();
  });
});
