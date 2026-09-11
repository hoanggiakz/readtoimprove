import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40 text-muted-foreground text-sm">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-lg text-foreground">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <BookOpen className="h-4 w-4" />
              </div>
              <span>ReadToImprove</span>
            </div>
            <p className="text-sm leading-relaxed max-w-md">
              Nền tảng đọc tin tức quốc tế song ngữ Anh–Việt giúp người học nâng cao phản xạ đọc hiểu, mở rộng vốn từ vựng học thuật (IELTS / TOEFL) và chuyên ngành một cách tự nhiên.
            </p>
            <div className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-muted-foreground max-w-lg">
              <span className="font-semibold text-foreground">Chính sách Bản quyền & Giáo dục:</span> Mọi bài báo đều ghi rõ nguồn gốc xuất xứ và liên kết trực tiếp tới nhà xuất bản gốc. Nội dung được dịch đối chiếu song ngữ và gắn chú giải từ vựng phục vụ mục đích nghiên cứu & học tập (Fair Use).
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Chuyên mục</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#technology" className="hover:text-foreground transition-colors">
                  Công nghệ (Technology)
                </Link>
              </li>
              <li>
                <Link href="/#business" className="hover:text-foreground transition-colors">
                  Kinh tế (Business & Economy)
                </Link>
              </li>
              <li>
                <Link href="/#science" className="hover:text-foreground transition-colors">
                  Khoa học & Môi trường
                </Link>
              </li>
              <li>
                <Link href="/#culture" className="hover:text-foreground transition-colors">
                  Văn hóa & Đời sống
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: CEFR Levels */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Cấp độ CEFR</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  B1 — Intermediate
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  B2 — Upper Intermediate
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  C1 — Advanced
                </span>
              </li>
              <li>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  C2 — Proficiency
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {currentYear} ReadToImprove. Nền tảng học tiếng Anh qua tin tức thực tế.</p>
          <div className="flex items-center gap-6">
            <span>Phiên bản 1.0.0</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Hệ thống sẵn sàng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
