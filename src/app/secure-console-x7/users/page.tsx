import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security";
import { UserManager } from "@/components/admin/user-manager";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          savedVocabulary: true,
          readingHistory: true,
        },
      },
    },
  });

  return <UserManager initialUsers={users} currentAdminId={admin.id} />;
}
