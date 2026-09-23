# ReadToImprove — Testing Guide & Conventions

Chào mừng bạn đến với hướng dẫn kiểm thử của **ReadToImprove**. Tài liệu này định nghĩa quy chuẩn viết, chạy và đo lường unit test / component test từ Phase 10.5 trở đi.

---

## 1. Quick Start — Chạy Test

Hệ thống cung cấp các npm script sau cho kiểm thử:

```bash
# Chạy toàn bộ unit & component tests một lần (CI mode)
npm test

# Chạy ở chế độ lắng nghe (watch mode) tự động re-run khi lưu file
npm run test:watch

# Mở giao diện đồ họa trực quan trên trình duyệt (Vitest UI)
npm run test:ui

# Chạy test và xuất báo cáo độ bao phủ mã nguồn (v8 coverage report)
npm run test:coverage
```

---

## 2. Công Nghệ & Hạ Tầng

- **Test Runner**: [Vitest](https://vitest.dev/) (Native ESM, blazing fast, tương thích Vite transform & TypeScript paths).
- **DOM Environment**: `jsdom` (Giả lập W3C DOM đầy đủ hỗ trợ ARIA & Accessibility queries).
- **Component Harness**: `@testing-library/react` (v16+, tương thích React 19).
- **DOM Matchers**: `@testing-library/jest-dom` (cung cấp `toBeInTheDocument`, `toHaveClass`, `toBeVisible`, etc.).
- **User Interactions**: `@testing-library/user-event` (mô phỏng tương tác người dùng chân thực: click, type, keyboard focus).
- **Coverage Engine**: `@vitest/coverage-v8` (đo độ bao phủ trực tiếp bằng engine V8 của Node.js).
- **Path Resolution**: `vite-tsconfig-paths` (tự động phân giải alias `@/*` khớp với `tsconfig.json`).

---

## 3. Quy Ước Đặt Tên & Vị Trí File Test

### 3.1 Vị trí file test (Colocation vs Dedicated Directory)
Dự án hỗ trợ cả hai mô hình và ưu tiên tổ chức trong thư mục `__tests__/`:
1. **Khuyến nghị chính**: Đặt trong thư mục con `__tests__/` cùng cấp với module:
   - `src/lib/__tests__/url-utils.test.ts`
   - `src/components/__tests__/cefr-badge.test.tsx`
2. **Quy tắc đặt tên file**:
   - File logic / pure functions: `[filename].test.ts` hoặc `[filename].spec.ts`
   - File component React / JSX: `[filename].test.tsx` hoặc `[filename].spec.tsx`

---

## 4. Hướng Dẫn Viết Test (Mẫu Chuẩn Cho Phase 11+)

### 4.1 Mẫu Unit Test cho Pure Function / Utility
Áp dụng cho các hàm tính toán, định dạng, thuật toán slicing, sanitization:

```typescript
import { describe, it, expect } from "vitest";
import { sanitizeReturnUrl } from "@/lib/url-utils";

describe("sanitizeReturnUrl Suite", () => {
  it("preserves safe internal relative URLs", () => {
    expect(sanitizeReturnUrl("/articles/sample")).toBe("/articles/sample");
  });

  it("neutralizes protocol-relative open redirects", () => {
    expect(sanitizeReturnUrl("//attacker.com")).toBe("/");
  });
});
```

### 4.2 Mẫu Component Test (React Testing Library)
Áp dụng cho các UI component, badge, button, modal dialog:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CefrBadge } from "@/components/ui/cefr-badge";

describe("CefrBadge Component", () => {
  it("renders level code correctly", () => {
    render(<CefrBadge level="B2" />);
    expect(screen.getByText("B2")).toBeInTheDocument();
  });
});
```

### 4.3 Mẫu Mocking Next.js Primitives
Tệp cấu hình toàn cục `vitest.setup.ts` đã cài đặt sẵn mock cho:
- `next/navigation`: `useRouter()`, `usePathname()`, `useSearchParams()`.
- `next/image`: Tự động render thành thẻ `<img>` tiêu chuẩn.

Nếu cần override mock cụ thể cho từng test:
```typescript
import { vi } from "vitest";
import * as navigation from "next/navigation";

vi.spyOn(navigation, "usePathname").mockReturnValue("/secure-console-x7");
```

---

## 5. Quy Chuẩn Coverage Thresholds

Hệ thống đặt ngưỡng đo lường tối thiểu:
- **Lines**: $\ge 80\%$
- **Branches**: $\ge 70\%$

Khi bổ sung tính năng mới trong Phase 11 (như Flashcards SRS algorithms, review queues):
1. Đảm bảo viết unit test bao phủ toàn bộ nhánh logic rẽ nhánh (`if / else`, ternary, fallback).
2. Chạy `npm run test:coverage` để kiểm tra độ bao phủ trước khi commit.
3. Không bypass threshold nếu không có lý do kiến trúc được phê duyệt trong ADR.
