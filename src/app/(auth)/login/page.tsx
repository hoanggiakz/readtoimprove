import * as React from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập | ReadToImprove",
  description: "Đăng nhập vào tài khoản ReadToImprove để lưu từ vựng và theo dõi lịch sử đọc.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};


export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Đăng nhập tài khoản
        </h1>
        <p className="text-xs text-muted-foreground">
          Truy cập sổ từ vựng cá nhân và theo dõi tiến độ luyện đọc
        </p>
      </div>

      <React.Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
