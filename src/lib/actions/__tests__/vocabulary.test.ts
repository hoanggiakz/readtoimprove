import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveVocabularyAction, unsaveVocabularyAction } from "@/lib/actions/vocabulary";

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
    vocabulary: {
      findUnique: vi.fn().mockResolvedValue({ id: "vocab-1" }),
    },
    userSavedVocabulary: {
      upsert: vi.fn().mockResolvedValue({ id: "saved-1" }),
      delete: vi.fn().mockResolvedValue({ id: "saved-1" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { auth } from "@/lib/auth";

describe("vocabulary Server Actions Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-ACT-VOCAB-01: Unauthenticated save
  it("TC-ACT-VOCAB-01: saveVocabularyAction rejects unauthenticated caller with UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await saveVocabularyAction({ vocabularyId: "vocab-1" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-VOCAB-02: Non-existent vocabulary
  it("TC-ACT-VOCAB-02: saveVocabularyAction returns NOT_FOUND if vocabulary ID does not exist", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.vocabulary.findUnique.mockResolvedValueOnce(null);

    const result = await saveVocabularyAction({ vocabularyId: "nonexistent-vocab" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("NOT_FOUND");
  });

  // TC-ACT-VOCAB-03: Successful save
  it("TC-ACT-VOCAB-03: saveVocabularyAction upserts vocabulary for authenticated caller", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.vocabulary.findUnique.mockResolvedValueOnce({ id: "vocab-1" });

    const result = await saveVocabularyAction({ vocabularyId: "vocab-1" });
    expect(result.success).toBe(true);
    expect(result.data?.isSaved).toBe(true);
    expect(mockPrisma.userSavedVocabulary.upsert).toHaveBeenCalled();
  });

  // TC-ACT-VOCAB-04: Unauthenticated unsave
  it("TC-ACT-VOCAB-04: unsaveVocabularyAction rejects unauthenticated caller with UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const result = await unsaveVocabularyAction({ vocabularyId: "vocab-1" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("UNAUTHORIZED");
  });

  // TC-ACT-VOCAB-05: Successful unsave
  it("TC-ACT-VOCAB-05: unsaveVocabularyAction removes saved vocabulary link cleanly", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    const result = await unsaveVocabularyAction({ vocabularyId: "vocab-1" });
    expect(result.success).toBe(true);
    expect(result.data?.isSaved).toBe(false);
  });

  // TC-ACT-VOCAB-06: Idempotent unsave
  it("TC-ACT-VOCAB-06: unsaveVocabularyAction handles idempotent deletion without throwing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", email: "user@test.com", role: "USER" } } as any);
    mockPrisma.userSavedVocabulary.deleteMany.mockResolvedValueOnce({ count: 0 });

    const result = await unsaveVocabularyAction({ vocabularyId: "vocab-already-removed" });
    expect(result.success).toBe(true);
    expect(result.data?.isSaved).toBe(false);
  });
});
