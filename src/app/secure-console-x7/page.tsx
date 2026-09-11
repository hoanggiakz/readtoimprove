import Link from "next/link";
import { ArticleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { processScheduledArticlesFormAction } from "@/lib/actions/admin";
import {
  FileText,
  AlignLeft,
  BookA,
  Users,
  Tags,
  ShieldAlert,
  CheckCircle,
  PlusCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const now = new Date();

  // Load live statistics and scheduled status
  const [
    articleCount,
    sentenceCount,
    vocabCount,
    userCount,
    categoryCount,
    dueScheduledCount,
    auditLogs,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.sentence.count(),
    prisma.vocabulary.count(),
    prisma.user.count(),
    prisma.category.count(),
    prisma.article.count({
      where: {
        status: { in: [ArticleStatus.DRAFT, ArticleStatus.PENDING_REVIEW] },
        scheduledAt: { lte: now },
      },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Hệ thống Quản trị Bảo mật
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            Xin chào, {admin.name}
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Khu vực quản trị riêng biệt của dự án ReadToImprove. Toàn bộ hoạt động được bảo vệ bằng cơ chế xác thực đa tầng (Server-Side Defense-in-Depth).
          </p>
        </div>

        {/* Quick Action CTAs */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/secure-console-x7/articles/new">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
              <PlusCircle className="h-4 w-4" />
              <span>Tạo bài viết mới</span>
            </Button>
          </Link>
          <Link href="/secure-console-x7/articles">
            <Button size="sm" variant="outline" className="gap-1.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700">
              <FileText className="h-4 w-4 text-sky-400" />
              <span>Quản lý bài viết</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Scheduled Articles Banner (if any due) */}
      {dueScheduledCount > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Có {dueScheduledCount} bài viết đã đến hạn xuất bản tự động!
              </p>
              <p className="text-xs text-amber-200/80">
                Nhấp nút bên cạnh để kích hoạt chuyển đổi trạng thái sang PUBLISHED ngay lập tức.
              </p>
            </div>
          </div>
          <form action={processScheduledArticlesFormAction}>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold gap-1">
              <span>Xử lý xuất bản ngay</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      )}

      {/* Database Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/secure-console-x7/articles" className="group">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 transition-all group-hover:border-slate-700 group-hover:bg-slate-900">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Bài viết</span>
              <FileText className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{articleCount}</p>
            <span className="text-[10px] text-sky-400 font-medium">Xem tất cả bài viết →</span>
          </div>
        </Link>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Câu song ngữ</span>
            <AlignLeft className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{sentenceCount}</p>
          <span className="text-[10px] text-slate-400">Đối chiếu Anh - Việt</span>
        </div>

        <Link href="/secure-console-x7/vocabulary" className="group">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 transition-all group-hover:border-slate-700 group-hover:bg-slate-900">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Từ vựng toàn cầu</span>
              <BookA className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{vocabCount}</p>
            <span className="text-[10px] text-purple-400 font-medium">B1 – C2 toàn cầu →</span>
          </div>
        </Link>

        <Link href="/secure-console-x7/users" className="group">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 transition-all group-hover:border-slate-700 group-hover:bg-slate-900">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Tài khoản</span>
              <Users className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{userCount}</p>
            <span className="text-[10px] text-amber-400 font-medium">Quản lý tài khoản →</span>
          </div>
        </Link>

        <Link href="/secure-console-x7/categories" className="group">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 transition-all group-hover:border-slate-700 group-hover:bg-slate-900">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Chuyên mục</span>
              <Tags className="h-4 w-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">{categoryCount}</p>
            <span className="text-[10px] text-rose-400 font-medium">Quản lý chuyên mục →</span>
          </div>
        </Link>
      </div>

      {/* Security Status & Audit Log Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Controls Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-200">Trạng Thái An Ninh</h2>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Đường dẫn ẩn (Stealth Route)</span>
              <span className="font-mono text-emerald-400">Hoạt động</span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Robots.txt Chặn Thu Thập</span>
              <span className="font-mono text-emerald-400">Disallowed</span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Kiểm Tra Quyền Real-Time</span>
              <span className="font-mono text-emerald-400">requireAdmin()</span>
            </li>
            <li className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Phiên Đăng Nhập (Session)</span>
              <span className="font-mono text-emerald-400">HttpOnly / 7 ngày</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Bảo Tồn Từ Vựng Toàn Cầu</span>
              <span className="font-mono text-emerald-400">Không cascade xóa</span>
            </li>
          </ul>
        </div>

        {/* Recent Audit Trail */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-slate-200">Nhật Ký An Ninh Gần Đây</h2>
            </div>
            <Link
              href="/secure-console-x7/audit-logs"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Xem tất cả nhật ký →
            </Link>
          </div>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">Chưa có cảnh báo hoặc vi phạm bảo mật nào.</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-semibold text-amber-400">{log.action}</span>
                    <p className="text-[10px] text-slate-400">{log.details || log.entity}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
