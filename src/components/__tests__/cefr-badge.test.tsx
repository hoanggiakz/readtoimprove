import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { CefrBadge } from "@/components/ui/cefr-badge";
import { CefrLevel } from "@prisma/client";

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

  // TC-COMP-04: Renders all CEFR levels accurately
  it("TC-COMP-04: renders across all standard CEFR levels correctly", () => {
    const levels: CefrLevel[] = [
      CefrLevel.A1,
      CefrLevel.A2,
      CefrLevel.B1,
      CefrLevel.B2,
      CefrLevel.C1,
      CefrLevel.C2,
    ];

    levels.forEach((lvl) => {
      const { unmount } = render(<CefrBadge level={lvl} showLabel />);
      expect(screen.getByText(lvl)).toBeInTheDocument();
      unmount();
    });
  });

  // TC-COMP-05: Handles unknown or fallback level gracefully
  it("TC-COMP-05: handles unknown level with default fallback without crashing", () => {
    render(<CefrBadge level="UNKNOWN_LEVEL" showLabel />);
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("(Upper Intermediate)")).toBeInTheDocument();
  });

  // TC-COMP-06: Omits descriptive label when showLabel is false
  it("TC-COMP-06: omits label when showLabel is false", () => {
    render(<CefrBadge level="C1" showLabel={false} />);
    expect(screen.getByText("C1")).toBeInTheDocument();
    expect(screen.queryByText(/Advanced/i)).toBeNull();
  });
});
