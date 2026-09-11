"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    try {
      const result = await registerAction(formData);

      if (!result.success) {
        setErrorMessage(result.message || "Đăng ký không thành công.");
        if (result.errors) {
          setFieldErrors(result.errors);
        }
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Name Input */}
      <div className="space-y-1">
        <label htmlFor="name" className="block text-xs font-semibold text-foreground">
          Họ và tên
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Nguyễn Văn A"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {fieldErrors.name && (
          <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Email Input */}
      <div className="space-y-1">
        <label htmlFor="email" className="block text-xs font-semibold text-foreground">
          Địa chỉ Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ban@example.com"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
        )}
      </div>

      {/* Password Input */}
      <div className="space-y-1">
        <label htmlFor="password" className="block text-xs font-semibold text-foreground">
          Mật khẩu (Ít nhất 8 ký tự, gồm chữ và số)
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password[0]}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="block text-xs font-semibold text-foreground">
          Xác nhận mật khẩu
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-destructive">{fieldErrors.confirmPassword[0]}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading} className="w-full gap-2 font-medium mt-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tạo tài khoản...</span>
          </>
        ) : (
          <span>Tạo tài khoản học viên</span>
        )}
      </Button>

      {/* Login Link */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </form>
  );
}
