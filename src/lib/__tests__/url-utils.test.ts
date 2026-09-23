import { describe, it, expect } from "vitest";
import { sanitizeReturnUrl } from "@/lib/url-utils";

describe("sanitizeReturnUrl Pure Utility Suite", () => {
  // TC-UTIL-01: Valid relative URL
  it("TC-UTIL-01: preserves valid internal relative path", () => {
    expect(sanitizeReturnUrl("/articles/clean-energy")).toBe("/articles/clean-energy");
    expect(sanitizeReturnUrl("/me/reading-history?page=2")).toBe("/me/reading-history?page=2");
    expect(sanitizeReturnUrl("/word-bank#saved")).toBe("/word-bank#saved");
  });

  // TC-UTIL-02: Protocol-relative URLs
  it("TC-UTIL-02: neutralizes protocol-relative open redirect attacks", () => {
    expect(sanitizeReturnUrl("//evil.com")).toBe("/");
    expect(sanitizeReturnUrl("//evil.com/phishing", "/custom-fallback")).toBe("/custom-fallback");
  });

  // TC-UTIL-03: Backslash bypass attempts
  it("TC-UTIL-03: neutralizes backslash and mixed slash bypass attempts", () => {
    expect(sanitizeReturnUrl("/\\evil.com")).toBe("/");
    expect(sanitizeReturnUrl("\\evil.com")).toBe("/");
    expect(sanitizeReturnUrl("/articles\\evil")).toBe("/");
  });

  // TC-UTIL-04: External schemes, control characters, whitespace, and null/undefined
  it("TC-UTIL-04: neutralizes external schemes, control characters, whitespace, and handles null/undefined inputs", () => {
    expect(sanitizeReturnUrl("https://evil.com")).toBe("/");
    expect(sanitizeReturnUrl("http://attacker.org/steal")).toBe("/");
    expect(sanitizeReturnUrl("/javascript:alert(1)")).toBe("/");
    expect(sanitizeReturnUrl("/http:/attacker.com")).toBe("/");
    expect(sanitizeReturnUrl("/path with space")).toBe("/");
    expect(sanitizeReturnUrl("/path\x00nullbyte")).toBe("/");
    expect(sanitizeReturnUrl(null)).toBe("/");
    expect(sanitizeReturnUrl(undefined)).toBe("/");
    expect(sanitizeReturnUrl("")).toBe("/");
    expect(sanitizeReturnUrl("   ")).toBe("/");
  });
});
