import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sanitizeSearchQuery,
  getPublicVisibilityFilter,
  searchPublicArticles,
  getSearchSuggestions,
  SEARCH_DEFAULT_PAGE_SIZE,
} from "@/lib/search";
import { ArticleStatus, CefrLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    article: {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "art-1",
          slug: "clean-energy",
          titleEn: "Clean Energy",
          titleVi: "Năng lượng sạch",
          excerptEn: "Excerpt",
          excerptVi: "Tóm tắt",
          thumbnailUrl: null,
          cefrLevel: "B2",
          readingTimeMinutes: 5,
          publishedAt: new Date("2026-01-01T00:00:00Z"),
          sourceName: "Tech Asia",
          categories: [{ category: { id: "c1", slug: "tech", nameVi: "Công nghệ", nameEn: "Tech" } }],
        },
      ]),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn().mockImplementation((promises) => Promise.all(promises)),
  },
}));

describe("search Domain Business Logic Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-BUS-SRCH-01: Control characters removal
  it("TC-BUS-SRCH-01: sanitizeSearchQuery removes non-printable ASCII control characters", () => {
    const dirty = "clean\x00\x08energy\x1F";
    expect(sanitizeSearchQuery(dirty)).toBe("cleanenergy");
  });

  // TC-BUS-SRCH-02: Length truncation & trimming
  it("TC-BUS-SRCH-02: sanitizeSearchQuery trims whitespace and truncates at 100 characters", () => {
    const longString = "   " + "a".repeat(150) + "   ";
    const cleaned = sanitizeSearchQuery(longString);
    expect(cleaned).toHaveLength(100);
    expect(cleaned).toBe("a".repeat(100));
  });

  // TC-BUS-SRCH-03: Default visibility filter
  it("TC-BUS-SRCH-03: getPublicVisibilityFilter enforces PUBLISHED status and past/current timestamp", () => {
    const filter = getPublicVisibilityFilter();
    expect(filter.status).toBe(ArticleStatus.PUBLISHED);
    expect(filter.publishedAt).toBeDefined();
  });

  // TC-BUS-SRCH-04: Custom time parameter in visibility filter
  it("TC-BUS-SRCH-04: getPublicVisibilityFilter accepts and enforces custom reference timestamp", () => {
    const pastDate = new Date("2025-06-01T00:00:00Z");
    const filter = getPublicVisibilityFilter(pastDate);
    expect((filter.publishedAt as any)?.lte).toEqual(pastDate);
  });

  // TC-BUS-SRCH-05: Default page size constant
  it("TC-BUS-SRCH-05: SEARCH_DEFAULT_PAGE_SIZE equals 12", () => {
    expect(SEARCH_DEFAULT_PAGE_SIZE).toBe(12);
  });

  // TC-BUS-SRCH-06: Pagination boundary clamping
  it("TC-BUS-SRCH-06: searchPublicArticles clamps pageSize between 1 and 50", async () => {
    await searchPublicArticles({ pageSize: 100 });
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );

    await searchPublicArticles({ pageSize: -5 });
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    );
  });

  // TC-BUS-SRCH-07: Page index normalization
  it("TC-BUS-SRCH-07: searchPublicArticles normalizes page numbers <= 0 to 1", async () => {
    const result = await searchPublicArticles({ page: -2 });
    expect(result.currentPage).toBe(1);
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0 })
    );
  });

  // TC-BUS-SRCH-08: Suggestions query length threshold
  it("TC-BUS-SRCH-08: getSearchSuggestions returns empty array when query is under 2 characters", async () => {
    const emptyResult = await getSearchSuggestions("a");
    expect(emptyResult).toEqual([]);

    const blankResult = await getSearchSuggestions("   ");
    expect(blankResult).toEqual([]);
  });

  // TC-BUS-SRCH-09: Suggestions trims query string
  it("TC-BUS-SRCH-09: getSearchSuggestions trims query before evaluating length threshold", async () => {
    const result = await getSearchSuggestions("  b  ");
    expect(result).toEqual([]);
  });

  // TC-BUS-SRCH-10: Suggestions query execution for valid length
  it("TC-BUS-SRCH-10: getSearchSuggestions queries prisma when query length is >= 2", async () => {
    const suggestions = await getSearchSuggestions("clean");
    expect(suggestions).toBeDefined();
    expect(Array.isArray(suggestions)).toBe(true);
  });

  // TC-BUS-SRCH-11: Keyword search with query and filters
  it("TC-BUS-SRCH-11: searchPublicArticles performs full-text trigram ranked search when q is provided", async () => {
    vi.mocked(prisma.$queryRaw)
      .mockResolvedValueOnce([{ count: BigInt(1) } as any])
      .mockResolvedValueOnce([{ id: "art-1", rank: 2.5 } as any]);

    const result = await searchPublicArticles({
      q: "clean energy",
      categorySlug: "tech",
      cefrLevel: CefrLevel.B2,
      excludeId: "art-exclude",
    });

    expect(result.totalCount).toBe(1);
    expect(result.activeQuery).toBe("clean energy");
    expect(result.articles.length).toBe(1);
  });

  // TC-BUS-SRCH-12: Keyword search with zero matches
  it("TC-BUS-SRCH-12: searchPublicArticles returns empty array when keyword query matches 0 rows", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: BigInt(0) } as any]);

    const result = await searchPublicArticles({ q: "zero matches query" });
    expect(result.totalCount).toBe(0);
    expect(result.articles).toEqual([]);
    expect(result.hasNextPage).toBe(false);
  });
});
