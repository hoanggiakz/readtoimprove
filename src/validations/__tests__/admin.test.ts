import { describe, it, expect } from "vitest";
import {
  articleInputSchema,
  sentenceInputSchema,
  sentenceVocabTagSchema,
  categoryInputSchema,
  vocabularyInputSchema,
  userRoleSchema,
} from "@/validations/admin";

describe("Admin Validation Schemas", () => {
  // TC-VAL-ADM-01: articleInputSchema parses valid article
  it("TC-VAL-ADM-01: parses valid articleInputSchema payload", () => {
    const valid = {
      slug: "vietnam-green-energy",
      titleEn: "Vietnam's Green Energy Shift",
      titleVi: "Chuyển dịch năng lượng xanh tại Việt Nam",
      sourceName: "CleanTech",
      sourceUrl: "https://example.com/energy",
      cefrLevel: "B2",
      status: "DRAFT",
    };
    const result = articleInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.readingTimeMinutes).toBe(3);
    }
  });

  // TC-VAL-ADM-02: articleInputSchema rejects invalid slug format
  it("TC-VAL-ADM-02: rejects invalid slug formats (uppercase, spaces, special chars)", () => {
    expect(
      articleInputSchema.safeParse({
        slug: "Vietnam Green",
        titleEn: "Valid Title",
        titleVi: "Tiêu đề hợp lệ",
        sourceName: "Source",
        sourceUrl: "https://example.com",
      }).success
    ).toBe(false);

    expect(
      articleInputSchema.safeParse({
        slug: "vietnam_green",
        titleEn: "Valid Title",
        titleVi: "Tiêu đề hợp lệ",
        sourceName: "Source",
        sourceUrl: "https://example.com",
      }).success
    ).toBe(false);
  });

  // TC-VAL-ADM-03: articleInputSchema rejects invalid sourceUrl
  it("TC-VAL-ADM-03: rejects invalid sourceUrl string", () => {
    const result = articleInputSchema.safeParse({
      slug: "valid-slug",
      titleEn: "Valid Title",
      titleVi: "Tiêu đề hợp lệ",
      sourceName: "Source",
      sourceUrl: "not-a-valid-url",
    });
    expect(result.success).toBe(false);
  });

  // TC-VAL-ADM-04: sentenceInputSchema validates sentence with orderIndex >= 0
  it("TC-VAL-ADM-04: parses sentenceInputSchema and rejects negative orderIndex", () => {
    const valid = {
      articleId: "art-1",
      orderIndex: 0,
      textEn: "Sentence text in English.",
      textVi: "Văn bản câu tiếng Việt.",
    };
    expect(sentenceInputSchema.safeParse(valid).success).toBe(true);

    const invalid = { ...valid, orderIndex: -1 };
    expect(sentenceInputSchema.safeParse(invalid).success).toBe(false);
  });

  // TC-VAL-ADM-05: sentenceVocabTagSchema enforces positive offsets
  it("TC-VAL-ADM-05: enforces non-negative startOffset and positive endOffset", () => {
    const valid = {
      sentenceId: "sent-1",
      vocabularyId: "vocab-1",
      startOffset: 0,
      endOffset: 10,
      highlightedText: "sustainable",
    };
    expect(sentenceVocabTagSchema.safeParse(valid).success).toBe(true);

    expect(sentenceVocabTagSchema.safeParse({ ...valid, startOffset: -1 }).success).toBe(false);
    expect(sentenceVocabTagSchema.safeParse({ ...valid, endOffset: 0 }).success).toBe(false);
  });

  // TC-VAL-ADM-06: categoryInputSchema validates slug and names
  it("TC-VAL-ADM-06: parses categoryInputSchema and enforces slug constraints", () => {
    const valid = {
      slug: "tech-news",
      nameEn: "Tech News",
      nameVi: "Tin tức công nghệ",
    };
    expect(categoryInputSchema.safeParse(valid).success).toBe(true);

    const invalidSlug = { ...valid, slug: "a" };
    expect(categoryInputSchema.safeParse(invalidSlug).success).toBe(false);
  });

  // TC-VAL-ADM-07: vocabularyInputSchema validates word, lemma, and default CEFR level
  it("TC-VAL-ADM-07: validates vocabulary input and sets default B2 level", () => {
    const valid = {
      word: "resilience",
      normalizedLemma: "resilience",
      meaningVi: "khả năng phục hồi",
    };
    const result = vocabularyInputSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cefrLevel).toBe("B2");
    }
  });

  // TC-VAL-ADM-08: userRoleSchema validates allowed USER and ADMIN roles
  it("TC-VAL-ADM-08: parses allowed user roles and rejects invalid role", () => {
    expect(userRoleSchema.safeParse({ userId: "u1", role: "ADMIN" }).success).toBe(true);
    expect(userRoleSchema.safeParse({ userId: "u1", role: "USER" }).success).toBe(true);
    expect(userRoleSchema.safeParse({ userId: "u1", role: "SUPERUSER" }).success).toBe(false);
  });
});
