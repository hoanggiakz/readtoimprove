import { describe, it, expect } from "vitest";
import {
  wordBankQuerySchema,
  saveVocabularySchema,
  unsaveVocabularySchema,
} from "@/validations/word-bank";
import { CefrLevel } from "@prisma/client";

describe("Word Bank Validation Schemas", () => {
  // TC-VAL-WB-01: wordBankQuerySchema defaults & transform
  it("TC-VAL-WB-01: assigns defaults and normalizes search query < 2 chars to undefined", () => {
    const emptyResult = wordBankQuerySchema.safeParse({});
    expect(emptyResult.success).toBe(true);
    if (emptyResult.success) {
      expect(emptyResult.data.page).toBe(1);
      expect(emptyResult.data.limit).toBe(12);
      expect(emptyResult.data.cefr).toBe("ALL");
      expect(emptyResult.data.q).toBeUndefined();
    }

    const shortQuery = wordBankQuerySchema.safeParse({ q: "a" });
    expect(shortQuery.success).toBe(true);
    if (shortQuery.success) {
      expect(shortQuery.data.q).toBeUndefined();
    }

    const validQuery = wordBankQuerySchema.safeParse({ q: "sustainable" });
    expect(validQuery.success).toBe(true);
    if (validQuery.success) {
      expect(validQuery.data.q).toBe("sustainable");
    }
  });

  // TC-VAL-WB-02: wordBankQuerySchema accepts CEFR or 'ALL'
  it("TC-VAL-WB-02: accepts CefrLevel enum values or 'ALL'", () => {
    expect(wordBankQuerySchema.safeParse({ cefr: CefrLevel.B1 }).success).toBe(true);
    expect(wordBankQuerySchema.safeParse({ cefr: "ALL" }).success).toBe(true);
    expect(wordBankQuerySchema.safeParse({ cefr: "INVALID" as any }).success).toBe(false);
  });

  // TC-VAL-WB-03: saveVocabularySchema
  it("TC-VAL-WB-03: requires non-empty vocabularyId in saveVocabularySchema", () => {
    expect(saveVocabularySchema.safeParse({ vocabularyId: "vocab-1" }).success).toBe(true);
    expect(saveVocabularySchema.safeParse({ vocabularyId: "" }).success).toBe(false);
    expect(saveVocabularySchema.safeParse({}).success).toBe(false);
  });

  // TC-VAL-WB-04: unsaveVocabularySchema
  it("TC-VAL-WB-04: requires non-empty vocabularyId in unsaveVocabularySchema", () => {
    expect(unsaveVocabularySchema.safeParse({ vocabularyId: "vocab-1" }).success).toBe(true);
    expect(unsaveVocabularySchema.safeParse({ vocabularyId: "" }).success).toBe(false);
  });
});
