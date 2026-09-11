import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { ArticleList } from "@/components/admin/article-list";

export default async function AdminArticlesPage() {
  await requireAdmin();

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      categories: {
        include: {
          category: {
            select: { id: true, nameVi: true, slug: true },
          },
        },
      },
      _count: {
        select: {
          sentences: true,
        },
      },
    },
  });

  return <ArticleList initialArticles={articles} />;
}
