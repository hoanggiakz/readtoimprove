"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log client error securely to console
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-6">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
        Đã có sự cố xảy ra
      </h1>

      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md">
        Hệ thống gặp lỗi không mong muốn khi tải dữ liệu. Vui lòng thử tải lại trang hoặc quay lại trang chủ.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button onClick={() => reset()} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Thử tải lại
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Về trang chủ
          </Button>
        </Link>
      </div>
    </div>
  );
}
