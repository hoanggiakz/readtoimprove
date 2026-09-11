import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { ArticleForm } from "@/components/admin/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [article, categories] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      include: {
        categories: {
          select: { categoryId: true },
        },
      },
    }),
    prisma.category.findMany({
      select: { id: true, nameVi: true, nameEn: true },
      orderBy: { orderIndex: "asc" },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-100">Chỉnh Sửa Thông Tin Bài Viết</h1>
        <p className="text-xs text-slate-400">
          Cập nhật tiêu đề song ngữ, nguồn tin, chuyên mục và thông tin tối ưu hóa tìm kiếm (SEO).
        </p>
      </div>

      <ArticleForm initialData={article} categories={categories} />
    </div>
  );
}
