import { vi } from "vitest";

export function createMockPrisma() {
  const mockPrisma: any = {
    article: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "mock-art-id", ...args?.data })),
      update: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: args?.where?.id, ...args?.data })),
      delete: vi.fn().mockResolvedValue({ id: "mock-art-id" }),
    },
    sentence: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "mock-sent-id", ...args?.data })),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vocabulary: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "mock-vocab-id", ...args?.data })),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: "mock-user-id", ...args?.data })),
      update: vi.fn(),
    },
    userSavedVocabulary: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "mock-saved-id" }),
      delete: vi.fn().mockResolvedValue({ id: "mock-saved-id" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    readingHistory: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "mock-hist-id" }),
      update: vi.fn().mockResolvedValue({ id: "mock-hist-id" }),
      upsert: vi.fn().mockResolvedValue({ id: "mock-hist-id" }),
      delete: vi.fn().mockResolvedValue({ id: "mock-hist-id" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    userFavorite: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: "mock-fav-id" }),
      delete: vi.fn().mockResolvedValue({ id: "mock-fav-id" }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({ id: "mock-audit-id" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    $transaction: vi.fn(async (cb: any) => (typeof cb === "function" ? cb(mockPrisma) : Promise.all(cb))),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  return mockPrisma;
}
