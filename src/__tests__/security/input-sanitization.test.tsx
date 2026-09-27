import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import { sanitizeReturnUrl } from "@/lib/url-utils";
import { sliceSentenceText } from "@/lib/sentence-slicer";
import { SearchHighlight } from "@/components/search/search-highlight";

describe("Security: Input Sanitization & XSS Neutralization (FR-SEC-03, ADR-005, ADR-015)", () => {
  it("TC-SEC-SAN-01: sanitizeReturnUrl rejects protocol-relative URL bypasses", () => {
    expect(sanitizeReturnUrl("//evil.com")).toBe("/");
    expect(sanitizeReturnUrl("//google.com/phish")).toBe("/");
    expect(sanitizeReturnUrl("///evil.com")).toBe("/");
  });

  it("TC-SEC-SAN-02: sanitizeReturnUrl rejects Windows backslash redirection tricks", () => {
    expect(sanitizeReturnUrl("/\\evil.com")).toBe("/");
    expect(sanitizeReturnUrl("\\\\evil.com")).toBe("/");
    expect(sanitizeReturnUrl("\\evil.com")).toBe("/");
  });

  it("TC-SEC-SAN-03: sanitizeReturnUrl rejects javascript: and data: pseudo-schemes", () => {
    expect(sanitizeReturnUrl("javascript:alert(document.cookie)")).toBe("/");
    expect(sanitizeReturnUrl("JAVASCRIPT:alert(1)")).toBe("/");
    expect(sanitizeReturnUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(sanitizeReturnUrl("vbscript:msgbox(1)")).toBe("/");
  });

  it("TC-SEC-SAN-04: sanitizeReturnUrl rejects external absolute HTTP/HTTPS URLs", () => {
    expect(sanitizeReturnUrl("https://evil.com/login")).toBe("/");
    expect(sanitizeReturnUrl("http://attacker.org")).toBe("/");
    expect(sanitizeReturnUrl("ftp://files.org")).toBe("/");
  });

  it("TC-SEC-SAN-05: sanitizeReturnUrl strips control characters and CRLF injection", () => {
    expect(sanitizeReturnUrl("/articles\r\nSet-Cookie:admin=1")).toBe("/");
    expect(sanitizeReturnUrl("/articles\0evil")).toBe("/");
    expect(sanitizeReturnUrl("/articles\ttab")).toBe("/");
    expect(sanitizeReturnUrl("/articles\nnewline")).toBe("/");
  });

  it("TC-SEC-SAN-06: sanitizeReturnUrl safely allows valid internal relative paths and query parameters", () => {
    expect(sanitizeReturnUrl("/articles")).toBe("/articles");
    expect(sanitizeReturnUrl("/me/favorites?page=2&level=B2")).toBe("/me/favorites?page=2&level=B2");
    expect(sanitizeReturnUrl("/categories/technology")).toBe("/categories/technology");
    expect(sanitizeReturnUrl("")).toBe("/");
    expect(sanitizeReturnUrl(null as any)).toBe("/");
  });

  it("TC-SEC-SAN-07: sliceSentenceText handles raw HTML tags in text as literal text strings without DOM injection", () => {
    const maliciousSentence = "Scientists warned <script>alert('XSS')</script> about carbon levels.";
    const vocabInstances = [
      {
        startOffset: 18,
        endOffset: 47,
        highlightedText: "<script>alert('XSS')</script>",
        vocabulary: {
          id: "v1",
          word: "<script>alert('XSS')</script>",
          meaningVi: "Mã độc",
          cefrLevel: "C1" as const,
        },
      },
    ];

    const tokens = sliceSentenceText(maliciousSentence, vocabInstances);
    expect(tokens.length).toBe(3);
    expect(tokens[1].text).toBe("<script>alert('XSS')</script>");
    expect(tokens[1].isHighlight).toBe(true);
    expect(typeof tokens[1].text).toBe("string");
  });

  it("TC-SEC-SAN-08: SearchHighlight safely renders HTML-like substrings as text nodes without executing", () => {
    const text = "Discover <img src=x onerror=alert(1)> and sustainable energy";
    const query = "sustainable";

    const { container } = render(<SearchHighlight text={text} query={query} />);
    const mark = container.querySelector("mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe("sustainable");

    // The script/img tag must not render as an actual <img> element in the DOM tree
    const imgElement = container.querySelector("img");
    expect(imgElement).toBeNull();
    // It remains pure escaped text inside the container textContent
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });
});
