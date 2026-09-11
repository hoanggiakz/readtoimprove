import * as React from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-bold text-xl tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-none text-xl">ReadToImprove</span>
              <span className="text-[10px] font-medium text-muted-foreground">Đọc Báo Song Ngữ Anh–Việt</span>
            </div>
          </Link>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
