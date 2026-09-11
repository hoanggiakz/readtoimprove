import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategoriesPage() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    orderBy: { orderIndex: "asc" },
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  return <CategoryManager initialCategories={categories} />;
}
