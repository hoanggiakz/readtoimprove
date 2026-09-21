import Link from "next/link";
import { BookOpen, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { SearchCommandDialog } from "@/components/search/search-command-dialog";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { UserDropdownMenu } from "@/components/common/user-dropdown-menu";

export async function Header() {
  const session = await auth();

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
              className="transition-colors hover:text-foreground"
            >
              Trang chủ
            </Link>
            <Link
              href="/articles"
              className="transition-colors hover:text-foreground"
            >
              Bài viết
            </Link>
            <Link
              href="/categories"
              className="transition-colors hover:text-foreground"
            >
              Chuyên mục
            </Link>
            {session && (
              <Link
                href="/word-bank"
                className="transition-colors hover:text-foreground inline-flex items-center gap-1 font-medium text-primary"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Sổ từ vựng</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right Action Icons & Session Controls */}
        <div className="flex items-center gap-3">
          <SearchCommandDialog />

          <ThemeToggle />

          {/* User Session State */}
          {session ? (
            <div className="flex items-center gap-2 border-l pl-3">
              <UserDropdownMenu user={session.user} />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Đăng nhập
                </Button>
              </Link>
              <Link href="/register" className="hidden sm:inline-flex">
                <Button size="sm">
                  Đăng ký
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
