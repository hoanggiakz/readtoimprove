import { describe, it, expect, vi, beforeEach } from "vitest";
import { favoriteArticleAction, unfavoriteArticleAction } from "@/lib/actions/favorites";
import { ArticleStatus } from "@prisma/client";

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
    favorite: {
      upsert: vi.fn().mockResolvedValue({ id: "fav-1" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { auth } from "@/lib/auth";

describe("favorites Server Actions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-ACT-FAV-01: Unauthenticated favorite
  it("TC-ACT-FAV-01: favoriteArticleAction rejects unauthenticated caller with UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await favoriteArticleAction({ articleId: "art-1" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-FAV-02: Non-existent or unpublished article
  it("TC-ACT-FAV-02: favoriteArticleAction rejects non-existent or draft article with NOT_FOUND", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.article.findUnique.mockResolvedValueOnce(null);

    const result = await favoriteArticleAction({ articleId: "draft-art" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("NOT_FOUND");
  });

  // TC-ACT-FAV-03: Successful favorite
  it("TC-ACT-FAV-03: favoriteArticleAction marks article as favorited for authenticated user", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.article.findUnique.mockResolvedValueOnce({ id: "art-1", status: ArticleStatus.PUBLISHED } as any);

    const result = await favoriteArticleAction({ articleId: "art-1" });
    expect(result.success).toBe(true);
    expect(result.data?.isFavorited).toBe(true);
    expect(mockPrisma.favorite.upsert).toHaveBeenCalled();
  });

  // TC-ACT-FAV-04: Unauthenticated unfavorite
  it("TC-ACT-FAV-04: unfavoriteArticleAction rejects unauthenticated caller with UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await unfavoriteArticleAction({ articleId: "art-1" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-FAV-05: Successful unfavorite
  it("TC-ACT-FAV-05: unfavoriteArticleAction removes favorite relation cleanly", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const result = await unfavoriteArticleAction({ articleId: "art-1" });
    expect(result.success).toBe(true);
    expect(result.data?.isFavorited).toBe(false);
  });

  // TC-ACT-FAV-06: Idempotent unfavorite
  it("TC-ACT-FAV-06: unfavoriteArticleAction returns success even if record was already unfavorited", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.favorite.deleteMany.mockResolvedValueOnce({ count: 0 });

    const result = await unfavoriteArticleAction({ articleId: "art-already-unfavorited" });
    expect(result.success).toBe(true);
    expect(result.data?.isFavorited).toBe(false);
  });
});
