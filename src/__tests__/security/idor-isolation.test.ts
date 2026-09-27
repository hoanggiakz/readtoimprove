import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveVocabularyAction, unsaveVocabularyAction } from "@/lib/actions/vocabulary";
import { recordReadingProgressAction, clearReadingHistoryAction } from "@/lib/actions/reading-history";
import { favoriteArticleAction } from "@/lib/actions/favorites";

const { mockPrisma, mockAuth, mockRateLimit } = vi.hoisted(() => ({
  mockPrisma: {
    vocabulary: {
      findUnique: vi.fn(),
    },
    userSavedVocabulary: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    readingHistory: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    favorite: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    article: {
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
    },
  },
  mockAuth: vi.fn(),
  mockRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 29 }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe("Security: IDOR & Tenant Isolation (FR-SEC-01, ADR-009, ADR-013)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockRateLimit.mockResolvedValue({ success: true, remaining: 29 });
    mockPrisma.auditLog.create.mockResolvedValue({ id: "log-1" });
  });

  it("TC-SEC-IDOR-01: saveVocabularyAction isolates records strictly to session user, blocking spoofing", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "authenticated-user-123" },
    });
    mockPrisma.vocabulary.findUnique.mockResolvedValueOnce({ id: "vocab-456" });
    mockPrisma.userSavedVocabulary.upsert.mockResolvedValueOnce({ id: "save-1" });

    const result = await saveVocabularyAction({ vocabularyId: "vocab-456" });

    expect(result.success).toBe(true);
    expect(mockPrisma.userSavedVocabulary.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_vocabularyId: {
            userId: "authenticated-user-123",
            vocabularyId: "vocab-456",
          },
        },
      })
    );
  });

  it("TC-SEC-IDOR-02: unsaveVocabularyAction prevents deleting vocabulary from another user's Word Bank", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "victim-user-123" },
    });
    mockPrisma.userSavedVocabulary.deleteMany.mockResolvedValueOnce({ count: 1 });

    const result = await unsaveVocabularyAction({ vocabularyId: "vocab-789" });
    expect(result.success).toBe(true);

    expect(mockPrisma.userSavedVocabulary.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "victim-user-123",
        vocabularyId: "vocab-789",
      },
    });
  });

  it("TC-SEC-IDOR-03: favoriteArticleAction scopes favorite toggle to the authenticated caller only", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-alpha" },
    });
    mockPrisma.article.findUnique.mockResolvedValueOnce({ id: "art-1", status: "PUBLISHED" });
    mockPrisma.favorite.upsert.mockResolvedValueOnce({ id: "fav-1" });

    const result = await favoriteArticleAction({ articleId: "art-1" });
    expect(result.success).toBe(true);

    expect(mockPrisma.favorite.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_articleId: {
            userId: "user-alpha",
            articleId: "art-1",
          },
        },
      })
    );
  });

  it("TC-SEC-IDOR-04: recordReadingProgressAction updates reading progress strictly for authenticated caller", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-beta" },
    });
    mockPrisma.article.findUnique.mockResolvedValueOnce({ id: "art-2", status: "PUBLISHED" });
    mockPrisma.readingHistory.findUnique.mockResolvedValueOnce({
      userId: "user-beta",
      articleId: "art-2",
      readPercentage: 40,
    });
    mockPrisma.readingHistory.upsert.mockResolvedValueOnce({
      userId: "user-beta",
      articleId: "art-2",
      readPercentage: 65,
    });

    const result = await recordReadingProgressAction({
      articleId: "art-2",
      readPercentage: 65,
    });
    expect(result.success).toBe(true);

    expect(mockPrisma.readingHistory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_articleId: {
            userId: "user-beta",
            articleId: "art-2",
          },
        },
      })
    );
  });

  it("TC-SEC-IDOR-05: clearReadingHistoryAction deletes only caller's history, never cross-tenant", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "user-isolated" },
    });
    mockPrisma.readingHistory.deleteMany.mockResolvedValueOnce({ count: 12 });

    const result = await clearReadingHistoryAction({ timeframe: "all" });
    expect(result.success).toBe(true);

    expect(mockPrisma.readingHistory.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: "user-isolated",
      },
    });
  });

  it("TC-SEC-IDOR-06: server actions reject unauthenticated calls with UNAUTHORIZED status error", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await saveVocabularyAction({ vocabularyId: "vocab-anon" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
    expect(mockPrisma.userSavedVocabulary.upsert).not.toHaveBeenCalled();
  });
});
