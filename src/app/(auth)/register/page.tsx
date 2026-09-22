import * as React from "react";
import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản | ReadToImprove",
  description: "Tạo tài khoản học viên miễn phí trên ReadToImprove.",
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: false,
    follow: true,
  },
};


export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Tạo tài khoản học viên
        </h1>
        <p className="text-xs text-muted-foreground">
          Bắt đầu hành trình nâng cao phản xạ đọc tin tức song ngữ Anh–Việt
        </p>
      </div>

      <React.Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
        <RegisterForm />
      </React.Suspense>
    </div>
  );
}
