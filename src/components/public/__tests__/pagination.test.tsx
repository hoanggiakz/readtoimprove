import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Pagination } from "@/components/public/pagination";

describe("Pagination Public Component Suite", () => {
  it("TC-PUB-PGN-01: returns null when totalPages <= 1", () => {
    const { container: c1 } = render(
      <Pagination currentPage={1} totalPages={1} baseUrl="/articles" />
    );
    expect(c1).toBeEmptyDOMElement();

    const { container: c0 } = render(
      <Pagination currentPage={1} totalPages={0} baseUrl="/articles" />
    );
    expect(c0).toBeEmptyDOMElement();
  });

  it("TC-PUB-PGN-02: renders pagination nav with aria-label when totalPages > 1", () => {
    render(<Pagination currentPage={1} totalPages={5} baseUrl="/articles" />);
    const nav = screen.getByRole("navigation", {
      name: "Phân trang danh sách bài viết",
    });
    expect(nav).toBeInTheDocument();
  });

  it("TC-PUB-PGN-03: highlights the current page with aria-current='page'", () => {
    render(<Pagination currentPage={3} totalPages={5} baseUrl="/articles" />);
    const currentLink = screen.getByRole("link", { name: "3" });
    expect(currentLink).toHaveAttribute("aria-current", "page");
    expect(currentLink).toHaveClass("bg-primary");
  });

  it("TC-PUB-PGN-04: disables previous button on first page and enables on later pages", () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={5} baseUrl="/articles" />
    );
    const prevDisabled = screen.getByText("Trước").closest("[aria-disabled='true']");
    expect(prevDisabled).toHaveAttribute("aria-disabled", "true");

    rerender(<Pagination currentPage={2} totalPages={5} baseUrl="/articles" />);
    const prevLink = screen.getByRole("link", { name: /Trang trước/i });
    expect(prevLink).toHaveAttribute("href", "/articles");
  });

  it("TC-PUB-PGN-05: disables next button on last page and enables on earlier pages", () => {
    const { rerender } = render(
      <Pagination currentPage={5} totalPages={5} baseUrl="/articles" />
    );
    const nextDisabled = screen.getByText("Tiếp").closest("[aria-disabled='true']");
    expect(nextDisabled).toHaveAttribute("aria-disabled", "true");

    rerender(<Pagination currentPage={4} totalPages={5} baseUrl="/articles" />);
    const nextLink = screen.getByRole("link", { name: /Trang tiếp theo/i });
    expect(nextLink).toHaveAttribute("href", "/articles?page=5");
  });

  it("TC-PUB-PGN-06: renders ellipsis when totalPages exceeds delta window", () => {
    render(<Pagination currentPage={5} totalPages={10} baseUrl="/articles" />);
    const ellipses = screen.getAllByText("...");
    expect(ellipses.length).toBeGreaterThanOrEqual(1);
    ellipses.forEach((el) => {
      expect(el).toHaveAttribute("aria-hidden", "true");
    });
  });

  it("TC-PUB-PGN-07: preserves searchParams while constructing page URLs", () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={4}
        baseUrl="/articles"
        searchParams={{ category: "tech", cefr: "B2" }}
      />
    );

    const page3Link = screen.getByRole("link", { name: "3" });
    expect(page3Link.getAttribute("href")).toContain("category=tech");
    expect(page3Link.getAttribute("href")).toContain("cefr=B2");
    expect(page3Link.getAttribute("href")).toContain("page=3");
  });
});
