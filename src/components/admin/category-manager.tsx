"use client";

import * as React from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Tags, AlertCircle, Check, X } from "lucide-react";

interface CategoryItem {
  id: string;
  slug: string;
  nameEn: string;
  nameVi: string;
  description: string | null;
  orderIndex: number;
  _count: {
    articles: number;
  };
}

interface CategoryManagerProps {
  initialCategories: CategoryItem[];
}

export function CategoryManager({ initialCategories }: CategoryManagerProps) {
  const [categories, setCategories] = React.useState<CategoryItem[]>(initialCategories);

  // New Category State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [newSlug, setNewSlug] = React.useState("");
  const [newNameEn, setNewNameEn] = React.useState("");
  const [newNameVi, setNewNameVi] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newOrderIndex, setNewOrderIndex] = React.useState(categories.length);

  // Edit State
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editSlug, setEditSlug] = React.useState("");
  const [editNameEn, setEditNameEn] = React.useState("");
  const [editNameVi, setEditNameVi] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editOrderIndex, setEditOrderIndex] = React.useState(0);

  const [isPending, startTransition] = React.useTransition();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      const result = await createCategoryAction({
        slug: newSlug.trim().toLowerCase(),
        nameEn: newNameEn.trim(),
        nameVi: newNameVi.trim(),
        description: newDescription.trim() || null,
        orderIndex: Number(newOrderIndex),
      });

      if (result.success && result.data) {
        setCategories((prev) => [
          ...prev,
          {
            id: result.data!.id,
            slug: newSlug.trim().toLowerCase(),
            nameEn: newNameEn.trim(),
            nameVi: newNameVi.trim(),
            description: newDescription.trim() || null,
            orderIndex: Number(newOrderIndex),
            _count: { articles: 0 },
          },
        ]);
        setShowAddModal(false);
        setNewSlug("");
        setNewNameEn("");
        setNewNameVi("");
        setNewDescription("");
      } else {
        setErrorMessage(result.error || "Không thể tạo chuyên mục.");
      }
    });
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setEditSlug(cat.slug);
    setEditNameEn(cat.nameEn);
    setEditNameVi(cat.nameVi);
    setEditDescription(cat.description || "");
    setEditOrderIndex(cat.orderIndex);
  };

  const handleSaveEdit = (catId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateCategoryAction(catId, {
        slug: editSlug.trim().toLowerCase(),
        nameEn: editNameEn.trim(),
        nameVi: editNameVi.trim(),
        description: editDescription.trim() || null,
        orderIndex: Number(editOrderIndex),
      });

      if (result.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === catId
              ? {
                  ...c,
                  slug: editSlug.trim().toLowerCase(),
                  nameEn: editNameEn.trim(),
                  nameVi: editNameVi.trim(),
                  description: editDescription.trim() || null,
                  orderIndex: Number(editOrderIndex),
                }
              : c
          )
        );
        setEditingId(null);
      } else {
        setErrorMessage(result.error || "Lỗi cập nhật chuyên mục.");
      }
    });
  };

  const handleDelete = (catId: string, nameVi: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa chuyên mục '${nameVi}'?`)) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(catId);
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== catId));
      } else {
        setErrorMessage(result.error || "Lỗi xóa chuyên mục.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-rose-400" />
            <h1 className="text-xl font-bold text-slate-100">Quản Lý Chuyên Mục Tin Tức</h1>
          </div>
          <p className="text-xs text-slate-400">
            Hệ thống phân loại đa chuyên mục (Multi-Category Taxonomy) cho các bài đọc song ngữ.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm chuyên mục mới</span>
        </Button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
            <tr>
              <th className="px-4 py-3">Thứ tự</th>
              <th className="px-4 py-3">Tên tiếng Việt</th>
              <th className="px-4 py-3">Tên tiếng Anh</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Số bài viết</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <tr key={cat.id} className="bg-slate-950/80">
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={editOrderIndex}
                        onChange={(e) => setEditOrderIndex(Number(e.target.value))}
                        className="w-14 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editNameVi}
                        onChange={(e) => setEditNameVi(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editNameEn}
                        onChange={(e) => setEditNameEn(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                        className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-mono text-emerald-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-400">{cat._count.articles}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                          title="Lưu"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-800 rounded"
                          title="Hủy"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={cat.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-400">#{cat.orderIndex}</td>
                  <td className="px-4 py-3 font-medium text-slate-100">{cat.nameVi}</td>
                  <td className="px-4 py-3 text-slate-300">{cat.nameEn}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 text-[11px]">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                      {cat._count.articles} bài
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.nameVi)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Xóa chuyên mục"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-100">Thêm Chuyên Mục Mới</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Tên tiếng Việt *</label>
                <input
                  type="text"
                  required
                  value={newNameVi}
                  onChange={(e) => {
                    setNewNameVi(e.target.value);
                  }}
                  placeholder="e.g. Công nghệ"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tên tiếng Anh *</label>
                <input
                  type="text"
                  required
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="e.g. Technology"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Slug (Đường dẫn tĩnh) *</label>
                <input
                  type="text"
                  required
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="e.g. technology"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Thứ tự hiển thị (orderIndex)</label>
                <input
                  type="number"
                  min={0}
                  value={newOrderIndex}
                  onChange={(e) => setNewOrderIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mô tả chuyên mục</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả tóm tắt về loại tin tức trong chuyên mục này..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="border-slate-700 text-slate-300"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  {isPending ? "Đang lưu..." : "Thêm chuyên mục"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
