import * as React from "react";
import type { Metadata } from "next";
import { ShieldCheck, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/security";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  title: "Admin Console — ReadToImprove",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side real-time administrator guard
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Stealth Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-slate-100">
              ReadToImprove Console
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Bảo mật Server-Side [ADMIN]
            </span>
          </div>
        </div>

        {/* Admin Session Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-medium text-slate-200">{admin.name}</span>
            <span className="text-[10px] text-emerald-400 font-mono">{admin.email}</span>
          </div>
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Đăng xuất</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
