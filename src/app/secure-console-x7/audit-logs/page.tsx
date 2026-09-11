import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { ShieldAlert } from "lucide-react";

export default async function AdminAuditLogsPage() {
  await requireAdmin();

  const auditLogs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <h1 className="text-xl font-bold text-slate-100">Nhật Ký An Ninh & Thao Tác Quản Trị</h1>
        </div>
        <p className="text-xs text-slate-400">
          Lưu vết bất biến (Audit Trail) ghi lại mọi thao tác tạo, sửa, xóa, xuất bản và các hành vi truy cập trái phép.
        </p>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Hành động (Action)</th>
                <th className="px-4 py-3">Thực thể (Entity)</th>
                <th className="px-4 py-3">Người thực hiện</th>
                <th className="px-4 py-3">Chi tiết (Metadata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-xs">
                    Chưa có nhật ký kiểm toán nào được ghi lại.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const isViolation =
                    log.action.includes("DENIED") ||
                    log.action.includes("UNAUTHORIZED") ||
                    log.action.includes("ATTEMPT");

                  let parsedDetails: Record<string, unknown> | null = null;
                  if (log.details) {
                    try {
                      parsedDetails = JSON.parse(log.details);
                    } catch {
                      parsedDetails = null;
                    }
                  }

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isViolation ? "bg-amber-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block font-mono font-semibold px-2 py-0.5 rounded text-[11px] border ${
                            isViolation
                              ? "bg-amber-950/60 text-amber-300 border-amber-800/60"
                              : "bg-slate-800 text-slate-200 border-slate-700"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-300">
                        <span>{log.entity}</span>
                        {log.entityId && (
                          <span className="block font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                            ID: {log.entityId}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {log.user ? (
                          <div>
                            <span className="font-medium text-slate-200">{log.user.name}</span>
                            <span className="block font-mono text-[10px] text-slate-400">
                              {log.user.email}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-500 italic">Hệ thống / Khách</span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-md">
                        {parsedDetails ? (
                          <pre className="rounded bg-slate-950/80 p-2 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-24 border border-slate-800">
                            {JSON.stringify(parsedDetails, null, 2)}
                          </pre>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            {log.details || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
