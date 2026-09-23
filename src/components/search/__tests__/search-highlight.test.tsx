import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { SearchHighlight } from "@/components/search/search-highlight";

describe("SearchHighlight Component Suite", () => {
  it("TC-SCH-HL-01: renders plain text when query is empty or undefined", () => {
    const { container: c1 } = render(<SearchHighlight text="Hello World" />);
    expect(c1.querySelector("mark")).toBeNull();
    expect(c1.textContent).toBe("Hello World");

    const { container: c2 } = render(<SearchHighlight text="Hello World" query="" />);
    expect(c2.querySelector("mark")).toBeNull();
    expect(c2.textContent).toBe("Hello World");
  });

  it("TC-SCH-HL-02: renders plain text when query length is less than 2 characters", () => {
    const { container } = render(<SearchHighlight text="Hello World" query="a" />);
    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("Hello World");
  });

  it("TC-SCH-HL-03: wraps matching substring in <mark> tag", () => {
    const { container } = render(<SearchHighlight text="Learn English with news" query="English" />);
    const mark = container.querySelector("mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe("English");
    expect(mark).toHaveClass("bg-primary/20");
  });

  it("TC-SCH-HL-04: matches case-insensitively while preserving original text casing", () => {
    const { container } = render(
      <SearchHighlight text="Technology and AI Innovations" query="technology" />
    );
    const mark = container.querySelector("mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe("Technology"); // Preserves uppercase T
  });

  it("TC-SCH-HL-05: safely escapes regex special characters in query", () => {
    const { container } = render(
      <SearchHighlight text="What is C++? It is fast (really)." query="C++" />
    );
    const mark = container.querySelector("mark");
    expect(mark).toBeInTheDocument();
    expect(mark?.textContent).toBe("C++");
  });

  it("TC-SCH-HL-06: applies custom className and highlightClassName", () => {
    const { container } = render(
      <SearchHighlight
        text="Vocabulary Mastery"
        query="Mastery"
        className="custom-parent"
        highlightClassName="custom-highlight-color"
      />
    );
    expect(container.firstElementChild).toHaveClass("custom-parent");
    const mark = container.querySelector("mark");
    expect(mark).toHaveClass("custom-highlight-color");
  });
});
