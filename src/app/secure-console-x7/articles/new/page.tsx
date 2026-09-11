import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { ArticleForm } from "@/components/admin/article-form";

export default async function NewArticlePage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    select: { id: true, nameVi: true, nameEn: true },
    orderBy: { orderIndex: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-100">Tạo Bài Viết Song Ngữ Mới</h1>
        <p className="text-xs text-slate-400">
          Nhập thông tin tiêu đề, tóm tắt, bản quyền nguồn tin và thiết lập phân loại CEFR.
        </p>
      </div>

      <ArticleForm categories={categories} />
    </div>
  );
}
