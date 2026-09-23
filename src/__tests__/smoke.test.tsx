import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

describe("Vitest & RTL Infrastructure Smoke Suite", () => {
  // TC-SMOKE-01: Vitest runner basic sanity
  it("TC-SMOKE-01: executes standard Vitest assertion cleanly", () => {
    expect(1 + 1).toBe(2);
    expect(true).toBe(true);
  });

  // TC-SMOKE-02: React Testing Library DOM render
  it("TC-SMOKE-02: renders a React component into jsdom", () => {
    const TestComponent = () => <h1>ReadToImprove Testing</h1>;
    render(<TestComponent />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeDefined();
  });

  // TC-SMOKE-03: @testing-library/jest-dom matchers
  it("TC-SMOKE-03: asserts with jest-dom custom matchers", () => {
    render(<div data-testid="status-box" className="p-4">Engine Active</div>);
    const box = screen.getByTestId("status-box");
    expect(box).toBeInTheDocument();
    expect(box).toHaveTextContent("Engine Active");
    expect(box).toHaveClass("p-4");
  });

  // TC-SMOKE-04: Path alias @/ resolution
  it("TC-SMOKE-04: successfully resolves path alias '@/lib/utils' and executes cn()", () => {
    const combined = cn("base-class", false && "ignored", "extra-class");
    expect(combined).toBe("base-class extra-class");
  });

  // TC-SMOKE-05: Asynchronous event handling with user-event
  it("TC-SMOKE-05: simulates interactive click events via @testing-library/user-event", async () => {
    const user = userEvent.setup();
    const Counter = () => {
      const [count, setCount] = useState(0);
      return (
        <button onClick={() => setCount((c) => c + 1)}>
          Count: {count}
        </button>
      );
    };

    render(<Counter />);
    const button = screen.getByRole("button", { name: /count: 0/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(screen.getByRole("button", { name: /count: 1/i })).toBeInTheDocument();
  });
});
