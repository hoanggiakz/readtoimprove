import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16 py-8 md:py-16">
      {/* HERO SECTION */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Học tiếng Anh học thuật qua tin tức quốc tế xác thực</span>
        </div>

        <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.15]">
          Đọc Báo Song Ngữ Anh–Việt
          <span className="block text-primary mt-2">Nâng Trình Tiếng Anh Tự Nhiên</span>
        </h1>

        <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Được thiết kế dành riêng cho người học IELTS/TOEFL, sinh viên và người đi làm. Trải nghiệm đọc đối chiếu câu song ngữ, bắt trọn từ vựng theo khung CEFR chuẩn châu Âu.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="#reading-demo">
            <Button size="lg" className="gap-2 shadow-sm font-semibold">
              <BookOpen className="h-4 w-4" />
              Khám phá trải nghiệm đọc
            </Button>
          </Link>
          <Link href="#golden-loop">
            <Button size="lg" variant="outline" className="gap-2">
              Tìm hiểu quy trình học
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* READING EXPERIENCE DEMO PREVIEW */}
      <section id="reading-demo" className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mẫu đọc đối chiếu song ngữ</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="b2">CEFR B2 — Upper Intermediate</Badge>
              <Badge variant="outline">Kinh tế & Công nghệ</Badge>
            </div>
          </div>

          {/* Bilingual Interactive Sentence Block */}
          <div className="space-y-6">
            {/* Sentence 1 */}
            <div className="group rounded-xl border border-border/80 bg-background p-4 sm:p-5 transition-all hover:border-primary/40 hover:shadow-sm">
              <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                Global renewable energy capacity expanded at an{" "}
                <span className="cursor-pointer rounded border-b-2 border-emerald-500 bg-emerald-50 px-1 py-0.5 font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300">
                  unprecedented
                </span>{" "}
                pace over the past decade, driven by technological innovations.
              </p>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed border-t pt-2 border-dashed">
                Công suất năng lượng tái tạo toàn cầu đã mở rộng với tốc độ <span className="font-semibold text-foreground">chưa từng có</span> trong thập kỷ qua, nhờ vào những cải tiến công nghệ.
              </p>
            </div>

            {/* Sentence 2 */}
            <div className="group rounded-xl border border-border/80 bg-background p-4 sm:p-5 transition-all hover:border-primary/40 hover:shadow-sm">
              <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed">
                Economists emphasize that adopting sustainable practices is no longer an optional strategy, but an{" "}
                <span className="cursor-pointer rounded border-b-2 border-sky-500 bg-sky-50 px-1 py-0.5 font-semibold text-sky-800 transition-colors hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300">
                  imperative
                </span>{" "}
                for long-term resilience.
              </p>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed border-t pt-2 border-dashed">
                Các chuyên gia kinh tế nhấn mạnh rằng việc áp dụng các thực hành bền vững không còn là chiến lược tùy chọn, mà là một <span className="font-semibold text-foreground">mệnh lệnh cấp thiết</span> cho khả năng phục hồi dài hạn.
              </p>
            </div>
          </div>

          {/* Interactive Feature Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Bấm từ vựng để mở phiên âm & nghĩa chi tiết</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Tùy chọn ẩn/hiện bản dịch tiếng Việt linh hoạt</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Lưu từ vựng trực tiếp vào Word Bank cá nhân</span>
            </div>
          </div>
        </div>
      </section>

      {/* THE GOLDEN READING LOOP */}
      <section id="golden-loop" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-xs uppercase tracking-widest">Phương pháp học cốt lõi</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Quy Trình Học 5 Bước (Golden Reading Loop)
          </h2>
          <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
            Biến mỗi bài báo quốc tế thành một buổi luyện tập đọc hiểu và tích lũy từ vựng học thuật toàn diện.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Step 1 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              01
            </div>
            <h3 className="font-semibold text-foreground text-base">Câu Tiếng Anh Gốc</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tiếp cận câu văn báo chí chuẩn ngữ pháp từ Reuters, BBC, The Guardian.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              02
            </div>
            <h3 className="font-semibold text-foreground text-base">Bản Dịch Đối Chiếu</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dịch thuật trau chuốt, bám sát ngữ cảnh, có thể bật/tắt hoặc rê chuột để kiểm tra.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              03
            </div>
            <h3 className="font-semibold text-foreground text-base">Highlight Từ Vựng</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Gạch chân từ vựng trọng tâm với mã màu chuẩn phân cấp độ CEFR từ B1 đến C2.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              04
            </div>
            <h3 className="font-semibold text-foreground text-base">Tooltip Giải Nghĩa</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hiện phiên âm IPA, từ loại, nghĩa tiếng Việt chính xác và ví dụ bổ sung ngay lập tức.
            </p>
          </div>

          {/* Step 5 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">
              05
            </div>
            <h3 className="font-semibold text-foreground text-base">Word Bank Cá Nhân</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Lưu từ mới vào sổ tay học tập, theo dõi tiến độ ghi nhớ và lịch sử đọc bài.
            </p>
          </div>
        </div>
      </section>

      {/* CEFR LEVELS OVERVIEW */}
      <section id="cefr" className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="rounded-2xl border border-border bg-muted/30 p-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Phân Loại Cấp Độ CEFR Quốc Tế</h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Lựa chọn bài viết phù hợp với trình độ hiện tại và mục tiêu nâng band điểm IELTS / TOEFL của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="b1">B1 — Intermediate</Badge>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">IELTS 4.5 – 5.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Từ vựng và cấu trúc câu quen thuộc trong đời sống, công việc và học tập hằng ngày.
              </p>
            </div>

            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-800 dark:bg-sky-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="b2">B2 — Upper Intermediate</Badge>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">IELTS 5.5 – 6.5</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bài viết chuyên sâu về kinh tế, công nghệ với vốn từ học thuật phong phú.
              </p>
            </div>

            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-4 dark:border-purple-800 dark:bg-purple-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="c1">C1 — Advanced</Badge>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">IELTS 7.0 – 8.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Văn phong bình luận phức tạp, thuật ngữ chuyên ngành và sắc thái ẩn ý cao cấp.
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-800 dark:bg-rose-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="c2">C2 — Proficiency</Badge>
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">IELTS 8.5 – 9.0</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Độ chính xác và tinh tế tương đương người bản xứ với vốn từ vựng học thuật đỉnh cao.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
