# ReadToImprove — Unit Testing Strategy & Architecture

Tài liệu này xác lập chiến lược phân lớp kiểm thử, phân định phạm vi trách nhiệm giữa **Unit Tests (Vitest)** và **Integration Verification Suites (scripts/verify-*.ts)** trong hệ thống ReadToImprove.

---

## 1. Triết Lý Kiểm Thử (Testing Pyramid & Layering)

Hệ thống áp dụng kiến trúc kiểm thử 2 lớp bổ trợ lẫn nhau, tránh trùng lặp công sức nhưng tối ưu độ tin cậy:

```
          ▲
         / \     Lớp 2: Integration Verification Suites (scripts/verify-*.ts)
        /   \    - Chạy trên live PostgreSQL (port 5433) + Prisma Client thật
       /     \   - Xác thực Auth JWT cookie, DB Transactions, GIN FTS, Cascade deletes
      /───────\
     /         \  Lớp 1: In-Memory Unit & Component Tests (Vitest + RTL)
    /           \ - Chạy siêu tốc trong bộ nhớ (JSDOM, < 2.5s)
   /             \- Bao phủ Pure Functions, SRS Algorithms, Formatters, Isolated UI
  /───────────────\
```

---

## 2. Ma Trận Phân Định Trách Nhiệm (Scope Matrix)

| Thành phần | Công cụ kiểm thử | Lý do & Cách tiếp cận |
|---|---|---|
| **Pure Utility Functions** (`src/lib/*.ts`) | **Vitest** | Thuật toán cắt câu (`sentence-slicer.ts`), sanitization URL (`url-utils.ts`), CEFR formatters (`cefr.ts`), offset calculations (`offsets.ts`). Dễ kiểm thử biên, không side-effect. |
| **Spaced Repetition (SRS) Engine** *(Phase 11)* | **Vitest** | Thuật toán tính khoảng cách ôn tập (SM-2, Leitner interval, ease factors, overdue calculation). Cần test ma trận dữ liệu toán học chính xác 100%. |
| **Pure UI Components** (`src/components/ui/`) | **Vitest + RTL** | Badges, Buttons, Dialog focus trapping logic, Dropdown UI logic. Kiểm tra DOM attributes, ARIA roles, class mapping. |
| **Complex Custom Hooks** | **Vitest + RTL** (`renderHook`) | Hooks quản lý client state nội bộ, debounce timer, audio controls. |
| **Database Constraints & Schema** | **Integration Scripts** (`verify-db.ts`) | Unique constraints, Foreign Keys, Cascade Deletes, Prisma migrations. Yêu cầu PostgreSQL engine thật để bắt lỗi DB. |
| **Full Authentication Lifecycle** | **Integration Scripts** (`verify-auth.ts`) | Bcrypt hash, Jose JWT sign/verify, Stealth route protection, rate limit sliding window. Cần end-to-end HTTP/Cookie context. |
| **Fulltext Search & GIN Indexes** | **Integration Scripts** (`verify-search.ts`, `verify-word-bank.ts`) | `pg_trgm`, PostgreSQL `to_tsvector`, ILIKE query execution. Không thể giả lập chính xác bằng mock in-memory. |
| **SEO, Sitemap & A11y Live Flow** | **Integration Scripts** (`verify-seo-a11y-perf.ts`) | Schema.org JSON-LD escaping, dynamic `/sitemap.xml`, `/robots.txt`, Core Web Vitals telemetry. |

---

## 3. Những Gì KHÔNG CẦN Viết Unit Test Bằng Vitest

1. **Không mock toàn bộ Prisma Client để test Database Queries**:
   - Việc viết mock 50 dòng cho `prisma.article.findMany({ where: ... })` thường chỉ kiểm tra "mock có được gọi hay không" chứ không bảo đảm câu lệnh SQL hoạt động chính xác trên PostgreSQL.
   - Các logic này đã được 9 verify suites hiện hành với 226 test cases kiểm tra trực tiếp trên DB thật.
2. **Không test Next.js Server Actions có session phức tạp bằng Vitest**:
   - Server Actions phụ thuộc `headers()`, `cookies()`, và JWT database verification. Hãy để `verify-*.ts` phụ trách kiểm tra luồng tích hợp này.

---

## 4. Lộ Trình Triển Khai Unit Test Cho Phase 11 (Flashcards & SRS)

Trong Phase 11, các module mới sau đây BẮT BUỘC phải có bộ Unit Test đi kèm:
1. `src/lib/srs/sm2.ts` $\to$ `src/lib/srs/__tests__/sm2.test.ts`:
   - Kiểm tra tính toán `interval` mới khi rating là 0, 1, 2, 3, 4, 5.
   - Kiểm tra điều chỉnh `easeFactor` (không giảm dưới 1.3).
   - Kiểm tra tính toán ngày ôn tập tiếp theo (`nextReviewDate`).
2. `src/components/flashcards/__tests__/flashcard-card.test.tsx`:
   - Kiểm tra trạng thái flip thẻ (Front $\leftrightarrow$ Back).
   - Kiểm tra bàn phím phím tắt (Space để lật, phím 1–4 để chấm điểm).
3. `src/components/flashcards/__tests__/rating-buttons.test.tsx`:
   - Kiểm tra sự kiện click kích hoạt đúng callback chấm điểm.
