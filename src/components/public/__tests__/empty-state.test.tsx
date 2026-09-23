import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { EmptyState } from "@/components/public/empty-state";

describe("EmptyState Public Component Suite", () => {
  it("TC-PUB-EMP-01: renders default title and description", () => {
    render(<EmptyState />);
    expect(
      screen.getByRole("heading", { name: "Không tìm thấy bài viết phù hợp" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Rất tiếc, không có bài viết nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xóa tất cả bộ lọc/i })).toHaveAttribute(
      "href",
      "/articles"
    );
  });

  it("TC-PUB-EMP-02: renders custom title and custom description", () => {
    render(
      <EmptyState
        title="Không có từ vựng nào"
        description="Bạn chưa lưu từ vựng nào vào sổ tay cá nhân."
      />
    );
    expect(
      screen.getByRole("heading", { name: "Không có từ vựng nào" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Bạn chưa lưu từ vựng nào vào sổ tay cá nhân.")
    ).toBeInTheDocument();
  });

  it("TC-PUB-EMP-03: renders custom resetUrl and custom resetLabel", () => {
    render(
      <EmptyState
        resetUrl="/word-bank?clear=1"
        resetLabel="Làm mới sổ từ"
      />
    );
    const link = screen.getByRole("link", { name: /Làm mới sổ từ/i });
    expect(link).toHaveAttribute("href", "/word-bank?clear=1");
  });

  it("TC-PUB-EMP-04: omits reset button when resetUrl is empty string", () => {
    render(<EmptyState resetUrl="" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("TC-PUB-EMP-05: renders decorative search icon container", () => {
    const { container } = render(<EmptyState />);
    const iconContainer = container.querySelector(".rounded-full.bg-muted\\/60");
    expect(iconContainer).toBeInTheDocument();
  });
});
