# 📚 ReadToImprove — Nền Tảng Đọc Báo Song Ngữ Anh – Việt Thông Minh

> **Nâng tầm khả năng đọc hiểu tiếng Anh học thuật (CEFR B1–C2, IELTS, TOEFL) qua tin tức thời sự quốc tế chính thống, kết hợp phương pháp học ngữ cảnh chuyên sâu.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Automated%20Tests-198%2F198%20PASS-success?style=flat-square)](scripts/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌟 Giới Thiệu Dự Án

**ReadToImprove** là nền tảng đọc tin tức song ngữ Anh – Việt được phát triển dựa trên cảm hứng từ *ReadToLead*, giải quyết triệt để rào cản lớn nhất của người học tiếng Anh trung cấp đến nâng cao: **Sự ngắt quãng khi phải liên tục chuyển tab tra từ điển lúc đọc tài liệu thực tế**.

Thay vì chỉ đọc các đoạn văn mẫu ngắn hoặc bản dịch máy thô ráp, **ReadToImprove** mang đến trải nghiệm đọc câu-đối-câu (*sentence-by-sentence parallel reading*) với nội dung tin tức thời sự chính thống (Công nghệ, Kinh tế, Môi trường, Xã hội). Người đọc vừa tiếp cận được văn phong báo chí chuẩn mực, vừa nắm bắt ngay từ vựng học thuật quan trọng theo khung tham chiếu CEFR mà không bao giờ bị đứt mạch tư duy.

---

## 🔁 Vòng Lặp Đọc Vàng (The Golden Reading Loop)

Trải nghiệm học tập cốt lõi được thiết kế theo chu trình 5 bước liền mạch:

```text
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│  1. Câu tiếng Anh gốc   │ ──> │   2. Dịch nghĩa chuẩn   │ ──> │ 3. Highlight từ vựng    │
│    (Authentic English)  │     │   (Contextual Meaning)  │     │   (CEFR B1-C2 Offsets)  │
└─────────────────────────┘     └─────────────────────────┘     └────────────┬────────────┘
                                                                             │
┌─────────────────────────┐     ┌─────────────────────────┐                  │
│ 5. Theo dõi tiến độ     │ <── │ 4. Lưu Sổ từ vựng       │ <────────────────┘
│    (Habits & Streaks)   │     │    (1-Click Word Bank)  │
└─────────────────────────┘     └─────────────────────────┘
```

1. **Đọc câu tiếng Anh tự nhiên**: Tiếp thu ngữ pháp và từ vựng trong văn cảnh thực tế.
2. **Đối chiếu tiếng Việt tức thì**: Kiểm tra độ hiểu nghĩa bằng bản dịch chuẩn xác được biên tập kỹ lưỡng.
3. **Tra cứu từ vựng học thuật**: Nhấp vào từ được highlight để xem phát âm IPA, nghĩa tiếng Việt và nghe audio chuẩn.
4. **Lưu vào Sổ từ vựng chỉ với 1 nhấp**: Tự động lưu kèm theo câu ví dụ gốc trong bài báo.
5. **Duy trì thói quen đọc**: Hệ thống tự động ghi nhận tiến độ đọc, chuỗi ngày học liên tục (Streak) và biểu đồ năng suất đọc hàng tuần.

---

## 📸 Giao Diện Nền Tảng

| Trình Đọc Báo Song Ngữ Chuyên Sâu | Bảng Điều Khiển Học Tập & Chuỗi Đọc |
|:---:|:---:|
| ![Article Reader](docs/phases/phase-09/evidence/06_article_reader_progress.png) | ![Learning Progress](docs/phases/phase-09/evidence/02_progress_dashboard.png) |
| *Thanh tiến độ đọc tự động, highlight từ vựng theo offset, nút lưu bài viết* | *Biểu đồ đọc 7 ngày Pure SVG, đếm chuỗi ngày đọc và mục tiêu tuần* |

| Trung Tâm Quản Lý Lịch Sử Đọc | Bộ Sưu Tập Bài Viết Yêu Thích |
|:---:|:---:|
| ![Reading History](docs/phases/phase-09/evidence/03_reading_history_list.png) | ![Favorites Grid](docs/phases/phase-09/evidence/04_favorites_grid.png) |
| *Lọc lịch sử theo chủ đề/CEFR, hiển thị % hoàn thành, xóa bảo mật* | *Lưu trữ các bài báo hay để đọc lại bất cứ lúc nào* |

---

## ⚡ Các Tính Năng Nổi Bật

### 1. 📖 Trình Đọc Báo Song Ngữ Đột Phá
- **3 Chế độ dịch linh hoạt**:
  - *Show All (Hiện tất cả)*: Hiển thị song song bản dịch tiếng Việt bên dưới từng câu.
  - *Interactive (Tương tác)*: Ẩn bản dịch, chỉ hiện ra khi người đọc nhấp vào icon mắt của câu đó.
  - *Hide All (Ẩn tất cả)*: Ẩn hoàn toàn bản dịch để người học tự thử thách khả năng đọc hiểu độc lập.
- **4 Kích thước font chữ**: Tùy chỉnh kích thước chữ hiển thị theo nhu cầu người đọc.
- **Giải thuật cắt ghép Highlight chính xác (`sentence-slicer`)**: Tính toán offset từng ký tự `[startOffset, endOffset]`, đảm bảo 100% độ trung thực của văn bản gốc, an toàn tuyệt đối trước các nguy cơ XSS.

### 2. 📓 Sổ Từ Vựng Cá Nhân (Word Bank)
- Lưu trữ mọi từ vựng cần nhớ kèm theo câu ví dụ thực tế trong bài báo.
- Tìm kiếm từ vựng siêu tốc nhờ chỉ mục mờ **PostgreSQL Trigram GIN (`pg_trgm`)** cho cả tiếng Anh lẫn nghĩa tiếng Việt.
- Lọc từ vựng theo cấp độ CEFR (B1, B2, C1, C2).
- Cơ chế lưu/bỏ lưu tường minh (*explicit intent*), cập nhật giao diện lạc quan (*optimistic UI*), loại trừ triệt để lỗi race-condition.

### 3. 🔍 Động Cơ Tìm Kiếm Toàn Diện & Autocomplete
- **PostgreSQL Full-Text Search**: Tận dụng cột vector sinh sẵn `searchVector` (`tsvector`) kết hợp đánh trọng số (`titleEn`: 'A', `excerptEn`: 'B', `sourceName`: 'C') và bộ giải nghĩa từ gốc (English Stemming).
- **Gợi ý trực tiếp (Live Autocomplete)**: Phản hồi dưới 50ms khi gõ từ 2 ký tự trở lên.
- **Command Palette (`Ctrl+K` / `⌘K`)**: Tra cứu bài viết nhanh chóng trên toàn trang ở bất kỳ đâu.
- **Lọc đa chiều**: Kết hợp đồng thời từ khóa + Chuyên mục + Cấp độ CEFR + Phân trang trên URL chuẩn SEO.

### 4. 📈 Theo Dõi Tiến Độ & Thói Quen Học Tập (Habit & Streak)
- **Tự động lưu tiến độ đọc**: Thuật toán debounce 5.000ms giúp giảm tải server, tự động kích hoạt lưu ngay lập tức khi người dùng chuyển tab (`visibilitychange`) hoặc thoát trang (`pagehide`).
- **Nguyên tắc bảo toàn tiến độ (Monotonic Progress)**: Phần trăm đọc chỉ tịnh tiến tăng, tự động đánh dấu "Đã đọc xong" khi vượt ngưỡng $\ge 90\%$.
- **Banner "Tiếp tục đọc" (Resume Reading Banner)**: Tự động phát hiện bài viết đang đọc dở (5% – 95%) để cuộn nhanh đến vị trí dừng trước đó.
- **Tính toán Chuỗi Đọc (Streak)**: Thuật toán tính chuỗi theo thời gian thực chuẩn múi giờ Việt Nam (`Asia/Ho_Chi_Minh`), độ trễ dưới 5ms, không cần tác vụ nền (cron job) phức tạp.
- **Biểu Đồ Năng Suất 7 Ngày (Pure SVG)**: Thành phần biểu đồ tùy chỉnh không dùng thư viện ngoài, dung lượng chưa tới 2KB, 100% SSR-safe, không gây hydration mismatch.

### 5. 🛡️ Bảng Quản Trị Bí Mật (Stealth Admin CMS)
- Đường dẫn quản trị bí mật (`/secure-console-x7`) hoàn toàn không xuất hiện trên giao diện công khai và được chặn triệt để trong `robots.txt`.
- Quản lý toàn bộ vòng đời bài viết: `DRAFT` $\rightarrow$ `PENDING` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`.
- Trình soạn thảo câu song ngữ trực quan kèm công cụ gán từ vựng và tự động dò offset highlight.
- Lưu vết nhật ký kiểm toán (*Audit Logs*) toàn bộ các thay đổi nhạy cảm trong hệ thống.
- Chống tự khóa tài khoản (*Self-Lockout Prevention*) và chống giáng cấp quản trị viên duy nhất.

---

## 🛠️ Kiến Trúc Kỹ Thuật (Architecture & Tech Stack)

| Thành phần | Công nghệ lựa chọn | Lý do kiến trúc & Ưu điểm |
|:---|:---|:---|
| **Core Framework** | Next.js 15 (App Router) | Tối ưu Server Components, streaming SSR, Server Actions type-safe |
| **Giao diện** | React 19 + Tailwind CSS | Hiệu năng cao, phong cách hiện đại, responsive hoàn hảo mọi thiết bị |
| **Ngôn ngữ** | TypeScript (Strict Mode) | Giảm thiểu tối đa lỗi runtime, an toàn kiểu dữ liệu từ DB lên UI |
| **Cơ sở dữ liệu** | PostgreSQL 16 (Docker) | Hỗ trợ full-text search bản địa (`tsvector`), trigram search (`pg_trgm`) |
| **ORM** | Prisma Client | Type-safe migrations, quan hệ dữ liệu chặt chẽ, tối ưu hóa truy vấn |
| **Xác thực & Bảo mật** | Jose JWT + Bcrypt | Session token ký mật mã chuẩn Stateless, bảo vệ chống Open Redirect |
| **Bảo vệ lưu lượng** | Sliding-Window Rate Limit | Ngăn chặn brute-force và spam ghi dữ liệu tiến độ đọc / tìm kiếm |
| **Hợp đồng API** | OpenAPI 3.1 | Đặc tả tài liệu hóa REST API chuẩn hóa trong `docs/api/openapi.yaml` |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Môi Trường Cục Bộ

### 1. Yêu cầu tiên quyết
- [Node.js](https://nodejs.org/) v18.17+ hoặc v20+
- [Docker & Docker Compose](https://www.docker.com/) (để chạy PostgreSQL 16)
- Git

### 2. Tải mã nguồn & Cài đặt dependencies
```bash
git clone https://github.com/hoanggiakz/readtoimprove.git
cd readtoimprove
npm install
```

### 3. Thiết lập biến môi trường
Tạo file `.env.local` từ mẫu có sẵn:
```bash
cp .env.example .env.local
```
Kiểm tra thông số cấu hình cơ bản trong `.env.local`:
```env
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="ReadToImprove"
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/readtoimprove?schema=public"
AUTH_SECRET="chuoi_bi_mat_ngau_nhien_toi_thieu_32_ky_tu_12345"
ADMIN_EMAIL="admin@readtoimprove.com"
ADMIN_INITIAL_PASSWORD="ChangeThisPasswordImmediatelyInProduction2026!"
ADMIN_ROUTE_PATH="/secure-console-x7"
```

### 4. Khởi động PostgreSQL qua Docker
```bash
docker compose up -d
```
*(Cổng host được gán là `5433` để tránh xung đột nếu máy bạn đã cài sẵn PostgreSQL ở cổng mặc định 5432).*

### 5. Chạy Migration & Dữ liệu mẫu (Seed Data)
```bash
npx prisma migrate deploy
npx prisma db seed
```

Tài khoản mẫu có sẵn sau khi seed:
- 🧑‍🎓 **Học viên (Learner)**: `learner@example.com` / `Learner2026!Password`
- 🛡️ **Quản trị viên (Admin)**: `admin@readtoimprove.com` / `ChangeThisPasswordImmediatelyInProduction2026!`

### 6. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng

Dự án áp dụng quy trình kiểm thử tự động nghiêm ngặt với **198 bài test kiểm thử hoàn thành 100%**:

```bash
# Chạy toàn bộ 8 bộ kiểm thử tích hợp (198/198 PASS)
npx tsx scripts/verify-db.ts                # Phase 2: Ràng buộc toàn vẹn cơ sở dữ liệu (10 tests)
npx tsx scripts/verify-auth.ts              # Phase 3: Mã hóa JWT & Bảo mật xác thực (10 tests)
npx tsx scripts/verify-admin.ts             # Phase 4: CMS Quản trị, Vòng đời bài viết, Audit (20 tests)
npx tsx scripts/verify-public.ts            # Phase 5: Khám phá công khai, SEO & Phân trang (20 tests)
npx tsx scripts/verify-reader.ts            # Phase 6: Trình đọc song ngữ & Thuật toán cắt câu (26 tests)
npx tsx scripts/verify-word-bank.ts         # Phase 7: Sổ từ vựng, Trigram Search, Cô lập dữ liệu (35 tests)
npx tsx scripts/verify-search.ts            # Phase 8: Full-Text Search, Stemming, Autocomplete (32 tests)
npx tsx scripts/verify-history-progress.ts  # Phase 9: Tiến độ đọc, Streaks, Biểu đồ & Open Redirect (45 tests)

# Kiểm tra cú pháp TypeScript
npm run typecheck

# Kiểm tra tiêu chuẩn mã nguồn
npm run lint

# Thử nghiệm đóng gói Production
npm run build
```

---

## 🗺️ Lộ Trình Phát Triển (Roadmap)

- [x] **Phase 00 — Khám Phá & Đặc Tả Yêu Cầu (BRD/FSD)**
- [x] **Phase 01 — Nền Tảng Dự Án & Thiết Kế Hệ Thống**
- [x] **Phase 02 — Cơ Sở Dữ Liệu PostgreSQL & Chiến Lược Seed Dữ Liệu**
- [x] **Phase 03 — Xác Thực Người Dùng & Quản Trị Stealth Admin**
- [x] **Phase 04 — Bảng Quản Trị CMS & Quản Lý Câu Song Ngữ**
- [x] **Phase 05 — Trang Chủ Khám Phá & Luồng Bài Báo Công Khai**
- [x] **Phase 06 — Trải Nghiệm Đọc Báo Song Ngữ Đột Phá**
- [x] **Phase 07 — Hệ Thống Từ Vựng & Sổ Từ Vựng Cá Nhân (Word Bank)**
- [x] **Phase 08 — Công Cụ Tìm Kiếm Toàn Diện (Full-Text Search) & Bộ Lọc**
- [x] **Phase 09 — Lịch Sử Đọc, Tiến Độ & Phân Tích Thói Quen Học Tập**
- [ ] **Phase 10 — Thẻ Ghi Nhớ Flashcards & Thuật Toán Lặp Lại Ngắt Quãng (SRS / SM-2)**
- [ ] **Phase 10.5 — Thiết Lập Khung Kiểm Thử Unit Test (Vitest + RTL + Coverage)**
- [ ] **Phase 11 — Kiểm Thử Tải Toàn Diện & Đánh Giá An Ninh Bảo Mật**
- [ ] **Phase 12 — Triển Khai Production Lên Vercel & Cơ Sở Dữ Liệu Cloud**
- [ ] **Phase 13 — Tối Ưu Hóa Hiệu Năng & Giám Sát Vận Hành**

---

## 📂 Danh Mục Tài Liệu Kỹ Thuật

Toàn bộ tài liệu kiến trúc và báo cáo từng giai đoạn được lưu trữ trong thư mục `docs/`:
- [00. Khám Phá & Đặc Tả Yêu Cầu BRD/FSD](docs/00_DISCOVERY_AND_REQUIREMENTS.md)
- [01. Đặc Tả Kiến Trúc Hệ Thống](docs/01_ARCHITECTURE_SPECIFICATION.md)
- [02. Thiết Kế Lược Đồ Cơ Sở Dữ Liệu](docs/02_DATABASE_SCHEMA_DESIGN.md)
- [03. Đặc Tả Bảo Mật & Quản Trị](docs/03_ADMIN_SECURITY_SPECIFICATION.md)
- [04. Mô Hình Nội Dung & Trải Nghiệm Đọc](docs/04_CONTENT_MODEL_AND_READING_EXPERIENCE.md)
- [05. Rủi Ro, Điểm Nhập Nhằng & Quyết Định Kỹ Thuật](docs/05_RISKS_AMBIGUITIES_AND_DECISIONS.md)
- [Nhật Ký Trạng Thái Dự Án & Bản Ghi Kiến Trúc (ADRs)](docs/PROJECT_STATE.md)
- [Hợp Đồng API Chuẩn OpenAPI 3.1](docs/api/openapi.yaml)

---

## 👤 Tác Giả & Bản Quyền

- **Tác giả**: Hoàng Gia ([@hoanggiakz](https://github.com/hoanggiakz))
- **Mã nguồn**: [https://github.com/hoanggiakz/readtoimprove](https://github.com/hoanggiakz/readtoimprove)
- **Giấy phép**: Dự án phát hành theo giấy phép [MIT License](LICENSE).
