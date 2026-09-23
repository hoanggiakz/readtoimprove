import { describe, it, expect, vi, beforeEach } from "vitest";
import { auditLog } from "@/lib/audit-log";

// Mock Prisma
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("audit-log Helper Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-BUS-AUD-01: Basic audit log creation
  it("TC-BUS-AUD-01: maps and persists auditLog entry fields to Prisma", async () => {
    await auditLog({
      userId: "user-1",
      action: "ARTICLE_FAVORITED",
      entityType: "Article",
      entityId: "art-1",
      ipAddress: "127.0.0.1",
      userAgent: "Vitest/TestRunner",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        action: "ARTICLE_FAVORITED",
        entity: "Article",
        entityId: "art-1",
        details: null,
        ipAddress: "127.0.0.1",
        userAgent: "Vitest/TestRunner",
      },
    });
  });

  // TC-BUS-AUD-02: Metadata JSON serialization
  it("TC-BUS-AUD-02: serializes metadata object into JSON string in details column", async () => {
    await auditLog({
      userId: "user-1",
      action: "READING_PROGRESS_UPDATED",
      entityType: "ReadingHistory",
      entityId: "art-1",
      metadata: { readPercentage: 95, completed: true },
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: JSON.stringify({ readPercentage: 95, completed: true }),
        }),
      })
    );
  });

  // TC-BUS-AUD-03: Null details when no metadata
  it("TC-BUS-AUD-03: sets details to null when metadata is undefined", async () => {
    await auditLog({
      userId: "user-1",
      action: "WORD_SAVED",
      entityType: "Vocabulary",
      entityId: "vocab-1",
    });

    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          details: null,
        }),
      })
    );
  });

  // TC-BUS-AUD-04: Error suppression
  it("TC-BUS-AUD-04: catches database error gracefully without throwing exception to caller", async () => {
    mockPrisma.auditLog.create.mockRejectedValueOnce(new Error("DB Connection Error"));
    const spyError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      auditLog({
        userId: "user-1",
        action: "TEST_ACTION",
        entityType: "Test",
        entityId: "id-1",
      })
    ).resolves.not.toThrow();

    spyError.mockRestore();
  });
});
