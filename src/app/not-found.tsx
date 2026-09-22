"use client";

import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="container mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <meta name="robots" content="noindex, nofollow" />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
        <FileQuestion className="h-8 w-8 text-primary" />
      </div>


      <span className="text-xs font-semibold uppercase tracking-widest text-primary">Lỗi 404</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
        Không tìm thấy trang yêu cầu
      </h1>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
        Trang bạn đang tìm kiếm có thể đã bị đổi tên, xóa hoặc liên kết không còn tồn tại.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </Link>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            if (typeof window !== "undefined") window.history.back();
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang trước
        </Button>
      </div>
    </main>
  );
}

