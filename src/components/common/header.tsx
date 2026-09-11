import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground transition-opacity hover:opacity-90"
            aria-label="ReadToImprove Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-lg">ReadToImprove</span>
              <span className="text-[10px] font-medium text-muted-foreground">Đọc Báo Song Ngữ Anh–Việt</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link
              href="/"
              className="transition-colors hover:text-foreground text-foreground"
            >
              Trang chủ
            </Link>
            <Link
              href="/#categories"
              className="transition-colors hover:text-foreground"
            >
              Chuyên mục
            </Link>
            <Link
              href="/#cefr"
              className="transition-colors hover:text-foreground"
            >
              Cấp độ CEFR
            </Link>
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          <Link href="/#search" aria-label="Tìm kiếm bài viết">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="h-5 w-5" />
            </Button>
          </Link>

          <ThemeToggle />

          <Link href="/#explore">
            <Button size="sm" className="hidden sm:inline-flex">
              Bắt đầu đọc
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
