import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import {
  ArticleCardSkeleton,
  ArticleGridSkeleton,
} from "@/components/public/article-card-skeleton";

describe("ArticleCardSkeleton Component Suite", () => {
  it("TC-PUB-SKL-01: renders ArticleCardSkeleton with animate-pulse styling", () => {
    const { container } = render(<ArticleCardSkeleton />);
    const card = container.firstElementChild;
    expect(card).toHaveClass("animate-pulse");
    expect(card).toHaveClass("rounded-xl");
    expect(card).toHaveClass("bg-card");
  });

  it("TC-PUB-SKL-02: renders thumbnail placeholder with aspect-video", () => {
    const { container } = render(<ArticleCardSkeleton />);
    const thumbnail = container.querySelector(".aspect-video");
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveClass("bg-muted/80");
  });

  it("TC-PUB-SKL-03: renders ArticleGridSkeleton with default count of 6 cards", () => {
    const { container } = render(<ArticleGridSkeleton />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards).toHaveLength(6);
  });

  it("TC-PUB-SKL-04: renders ArticleGridSkeleton with custom count", () => {
    const { container } = render(<ArticleGridSkeleton count={3} />);
    const cards = container.querySelectorAll(".animate-pulse");
    expect(cards).toHaveLength(3);
  });
});
