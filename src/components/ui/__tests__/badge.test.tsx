import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Badge } from "@/components/ui/badge";

describe("Badge UI Component Suite", () => {
  it("TC-UI-BDG-01: renders badge with default variant and children", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-primary");
    expect(badge).toHaveClass("rounded-full");
  });

  it("TC-UI-BDG-02: renders standard variants (secondary, destructive, outline)", () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toHaveClass("bg-secondary");

    rerender(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText("Destructive")).toHaveClass("bg-destructive");

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toHaveClass("text-foreground");
  });

  it("TC-UI-BDG-03: renders CEFR level variants correctly", () => {
    const { rerender } = render(<Badge variant="b1">B1 Level</Badge>);
    expect(screen.getByText("B1 Level")).toHaveClass("bg-emerald-50");

    rerender(<Badge variant="b2">B2 Level</Badge>);
    expect(screen.getByText("B2 Level")).toHaveClass("bg-sky-50");

    rerender(<Badge variant="c1">C1 Level</Badge>);
    expect(screen.getByText("C1 Level")).toHaveClass("bg-purple-50");

    rerender(<Badge variant="c2">C2 Level</Badge>);
    expect(screen.getByText("C2 Level")).toHaveClass("bg-rose-50");
  });

  it("TC-UI-BDG-04: merges custom className with variant styles", () => {
    render(<Badge className="extra-class shadow-md">Styled Badge</Badge>);
    const badge = screen.getByText("Styled Badge");
    expect(badge).toHaveClass("extra-class");
    expect(badge).toHaveClass("shadow-md");
    expect(badge).toHaveClass("bg-primary");
  });

  it("TC-UI-BDG-05: passes standard HTML attributes", () => {
    render(
      <Badge data-testid="custom-badge" aria-label="Status Badge" id="badge-1">
        Active
      </Badge>
    );
    const badge = screen.getByTestId("custom-badge");
    expect(badge).toHaveAttribute("aria-label", "Status Badge");
    expect(badge).toHaveAttribute("id", "badge-1");
  });

  it("TC-UI-BDG-06: renders complex nested children elements", () => {
    render(
      <Badge>
        <span data-testid="dot" className="w-2 h-2 rounded-full bg-green-500 mr-1" />
        <span>Live</span>
      </Badge>
    );
    expect(screen.getByTestId("dot")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
