"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Tags,
  BookA,
  Users,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Tổng quan",
    href: "/secure-console-x7",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Bài viết",
    href: "/secure-console-x7/articles",
    icon: FileText,
    exact: false,
  },
  {
    label: "Chuyên mục",
    href: "/secure-console-x7/categories",
    icon: Tags,
    exact: false,
  },
  {
    label: "Từ vựng toàn cầu",
    href: "/secure-console-x7/vocabulary",
    icon: BookA,
    exact: false,
  },
  {
    label: "Tài khoản",
    href: "/secure-console-x7/users",
    icon: Users,
    exact: false,
  },
  {
    label: "Nhật ký an ninh",
    href: "/secure-console-x7/audit-logs",
    icon: ShieldAlert,
    exact: false,
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin Navigation"
      className="border-b border-slate-800 bg-slate-900/50 px-6 py-2"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-slate-800 text-emerald-400 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-emerald-400" : "text-slate-400")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
