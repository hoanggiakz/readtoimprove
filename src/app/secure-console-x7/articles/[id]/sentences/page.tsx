import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { SentenceEditor } from "@/components/admin/sentence-editor";

export default async function ArticleSentencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const [article, sentences, vocabularies] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      select: { id: true, titleEn: true, titleVi: true, slug: true },
    }),
    prisma.sentence.findMany({
      where: { articleId: id },
      orderBy: { orderIndex: "asc" },
      include: {
        vocabularies: {
          include: {
            vocabulary: {
              select: {
                id: true,
                word: true,
                cefrLevel: true,
                meaningVi: true,
              },
            },
          },
        },
      },
    }),
    prisma.vocabulary.findMany({
      select: {
        id: true,
        word: true,
        cefrLevel: true,
        ipa: true,
        meaningVi: true,
      },
      orderBy: { word: "asc" },
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <SentenceEditor
      article={article}
      initialSentences={sentences}
      vocabularies={vocabularies}
    />
  );
}
