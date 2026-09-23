import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CefrBadge } from "@/components/ui/cefr-badge";

describe("CefrBadge Component Suite", () => {
  // TC-COMP-01: Renders CEFR level text
  it("TC-COMP-01: renders the correct CEFR level abbreviation", () => {
    render(<CefrBadge level="B2" />);
    expect(screen.getByText("B2")).toBeInTheDocument();
  });

  // TC-COMP-02: Renders label when showLabel is true
  it("TC-COMP-02: renders descriptive label when showLabel is enabled", () => {
    render(<CefrBadge level="B2" showLabel />);
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("(Upper Intermediate)")).toBeInTheDocument();
  });

  // TC-COMP-03: Applies badge styling classes
  it("TC-COMP-03: applies styling classes and custom className", () => {
    const { container } = render(<CefrBadge level="B1" className="custom-test-class" />);
    const badge = container.querySelector("span");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("custom-test-class");
    expect(badge).toHaveClass("font-mono");
    expect(badge).toHaveClass("bg-emerald-50");
  });
});
