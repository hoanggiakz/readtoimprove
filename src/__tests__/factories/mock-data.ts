import { ArticleStatus, CefrLevel, Role } from "@prisma/client";

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: "user-test-1",
    email: "learner@example.com",
    name: "Test Learner",
    passwordHash: "$2a$12$eX4mP1eHaShVaLuE",
    role: Role.USER,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockCategory(overrides: Record<string, any> = {}) {
  return {
    id: "cat-test-1",
    slug: "technology",
    nameEn: "Technology",
    nameVi: "Công nghệ",
    description: "Tech news and innovations",
    iconName: "Cpu",
    orderIndex: 0,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockArticle(overrides: Record<string, any> = {}) {
  return {
    id: "art-test-1",
    slug: "clean-energy-vietnam",
    titleEn: "Clean Energy in Vietnam",
    titleVi: "Năng lượng sạch tại Việt Nam",
    excerptEn: "Vietnam is rapidly transitioning toward renewable power.",
    excerptVi: "Việt Nam đang nhanh chóng chuyển đổi sang năng lượng tái tạo.",
    heroImageUrl: "https://example.com/hero.jpg",
    audioUrl: null,
    sourceName: "Clean Tech Asia",
    sourceUrl: "https://example.com/source",
    cefrLevel: CefrLevel.B2,
    readingTimeMinutes: 5,
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date("2026-01-01T12:00:00Z"),
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T12:00:00Z"),
    categories: [],
    sentences: [],
    ...overrides,
  };
}

export function createMockVocabulary(overrides: Record<string, any> = {}) {
  return {
    id: "vocab-test-1",
    word: "sustainable",
    normalizedLemma: "sustainable",
    ipa: "/səˈsteɪnəbl/",
    pos: "adjective",
    meaningVi: "bền vững",
    exampleEn: "Sustainable energy is essential.",
    exampleVi: "Năng lượng bền vững là thiết yếu.",
    cefrLevel: CefrLevel.B2,
    audioUrl: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  };
}

export function createMockSentence(overrides: Record<string, any> = {}) {
  return {
    id: "sent-test-1",
    articleId: "art-test-1",
    orderIndex: 0,
    textEn: "Vietnam is investing in sustainable microgrids.",
    textVi: "Việt Nam đang đầu tư vào các lưới điện vi mô bền vững.",
    audioStartTime: null,
    audioEndTime: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    vocabularyMappings: [],
    ...overrides,
  };
}
