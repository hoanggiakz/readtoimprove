import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { FileText, AlignLeft, BookA, Users, Tags, ShieldAlert, CheckCircle } from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  // Load live statistics from database
  const [articleCount, sentenceCount, vocabCount, userCount, categoryCount, auditLogs] =
    await Promise.all([
      prisma.article.count(),
      prisma.sentence.count(),
      prisma.vocabulary.count(),
      prisma.user.count(),
      prisma.category.count(),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-2">
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

      {/* Database Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Bài viết</span>
            <FileText className="h-4 w-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{articleCount}</p>
          <span className="text-[10px] text-emerald-400 font-medium">Đã xuất bản</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Câu song ngữ</span>
            <AlignLeft className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{sentenceCount}</p>
          <span className="text-[10px] text-slate-400">Đối chiếu Anh - Việt</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Từ vựng CEFR</span>
            <BookA className="h-4 w-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{vocabCount}</p>
          <span className="text-[10px] text-purple-400">B1 – C2 toàn cầu</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Tài khoản</span>
            <Users className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{userCount}</p>
          <span className="text-[10px] text-slate-400">1 Admin + Học viên</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Chuyên mục</span>
            <Tags className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100">{categoryCount}</p>
          <span className="text-[10px] text-slate-400">Phân loại tin</span>
        </div>
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
            <li className="flex items-center justify-between">
              <span>Phiên Đăng Nhập (Session)</span>
              <span className="font-mono text-emerald-400">HttpOnly / 7 ngày</span>
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
            <span className="text-[10px] text-slate-400 font-mono">Bảng AuditLog</span>
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
