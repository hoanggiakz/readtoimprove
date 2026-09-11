import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { VocabularyManager } from "@/components/admin/vocabulary-manager";

export default async function AdminVocabularyPage() {
  await requireAdmin();

  const vocabularies = await prisma.vocabulary.findMany({
    orderBy: { word: "asc" },
    include: {
      _count: {
        select: {
          sentenceInstances: true,
          userSaves: true,
        },
      },
    },
  });

  return <VocabularyManager initialVocabularies={vocabularies} />;
}
