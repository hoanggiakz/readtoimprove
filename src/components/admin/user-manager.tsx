"use client";

import * as React from "react";
import { Role } from "@prisma/client";
import { toggleUserActiveAction, updateUserRoleAction } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Users, Shield, User as UserIcon, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  _count: {
    savedVocabulary: number;
    readingHistory: number;
  };
}

interface UserManagerProps {
  initialUsers: UserItem[];
  currentAdminId: string;
}

export function UserManager({ initialUsers, currentAdminId }: UserManagerProps) {
  const [users, setUsers] = React.useState<UserItem[]>(initialUsers);
  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const handleToggleActive = (userId: string, _currentStatus: boolean) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await toggleUserActiveAction(userId);
      if (result.success && result.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: result.data!.isActive } : u))
        );
        setSuccessMessage(`Đã ${result.data.isActive ? "kích hoạt" : "vô hiệu hóa"} tài khoản thành công.`);
      } else {
        setErrorMessage(result.error || "Lỗi thay đổi trạng thái tài khoản.");
      }
    });
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await updateUserRoleAction(userId, newRole);
      if (result.success && result.data) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: result.data!.role } : u))
        );
        setSuccessMessage(`Đã cập nhật vai trò tài khoản thành ${result.data.role}.`);
      } else {
        setErrorMessage(result.error || "Lỗi cập nhật vai trò người dùng.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-400" />
          <h1 className="text-xl font-bold text-slate-100">Quản Lý Tài Khoản Người Dùng</h1>
        </div>
        <p className="text-xs text-slate-400">
          Kiểm soát quyền hạn (RBAC), trạng thái hoạt động và phòng chống tự khóa tài khoản quản trị viên (Self-Lockout Prevention).
        </p>
      </div>

      {/* Status Alerts */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Hoạt động học tập</th>
                <th className="px-4 py-3">Ngày đăng ký</th>
                <th className="px-4 py-3 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {users.map((user) => {
                const isCurrentAdmin = user.id === currentAdminId;

                return (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-100 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                        {user.role === Role.ADMIN ? (
                          <Shield className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span>{user.name}</span>
                        {isCurrentAdmin && (
                          <span className="ml-1.5 rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-800/50">
                            Bạn
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-300">{user.email}</td>

                    <td className="px-4 py-3">
                      <select
                        disabled={isPending || (isCurrentAdmin && users.filter((u) => u.role === Role.ADMIN).length <= 1)}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className={`rounded-md border px-2 py-1 text-[11px] font-medium font-mono focus:outline-none ${
                          user.role === Role.ADMIN
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                            : "bg-slate-950 text-slate-300 border-slate-800"
                        }`}
                      >
                        <option value={Role.USER}>USER (Học viên)</option>
                        <option value={Role.ADMIN}>ADMIN (Quản trị)</option>
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                          Vô hiệu hóa
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                      <span>{user._count.savedVocabulary} từ lưu</span>
                      <span className="text-slate-600 mx-1">/</span>
                      <span>{user._count.readingHistory} bài đã đọc</span>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {isCurrentAdmin ? (
                        <span className="text-[10px] text-slate-500 italic">Không thể tự khóa</span>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={`h-6 text-[11px] px-2.5 border ${
                            user.isActive
                              ? "border-rose-900/50 text-rose-300 hover:bg-rose-950 hover:border-rose-800"
                              : "border-emerald-900/50 text-emerald-300 hover:bg-emerald-950 hover:border-emerald-800"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1 text-rose-400" />
                              Vô hiệu hóa
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
                              Kích hoạt lại
                            </>
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
