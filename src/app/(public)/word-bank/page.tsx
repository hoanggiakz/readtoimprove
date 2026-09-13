import React from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/security';
import { wordBankQuerySchema } from '@/validations/word-bank';
import { getWordBankPage } from '@/lib/queries/vocabulary';
import { WordBankHeader } from '@/components/word-bank/word-bank-header';
import { WordBankFilterBar } from '@/components/word-bank/word-bank-filter-bar';
import { WordBankList } from '@/components/word-bank/word-bank-list';
import { Pagination } from '@/components/public/pagination';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sổ từ vựng cá nhân | ReadToImprove',
  description: 'Kho từ vựng tiếng Anh cá nhân được lưu trong quá trình đọc báo song ngữ tại ReadToImprove.',
  robots: {
    index: false,
    follow: false,
  },
};

interface WordBankPageProps {
  searchParams: Promise<{
    q?: string;
    cefr?: string;
    page?: string;
  }>;
}

export default async function WordBankPage({ searchParams }: WordBankPageProps) {
  // 1. Enforce authenticated user session (redirects to /login?returnUrl=%2Fword-bank if unauth)
  const user = await requireAuth('/word-bank');

  // 2. Parse and validate search parameters
  const rawParams = await searchParams;
  const validation = wordBankQuerySchema.safeParse(rawParams);
  const { q, cefr, page, limit } = validation.success
    ? validation.data
    : { q: undefined, cefr: 'ALL' as const, page: 1, limit: 12 };

  // 3. Query paginated saved vocabulary for current user
  const result = await getWordBankPage({
    userId: user.id,
    q,
    cefr,
    page,
    limit,
  });

  const isFiltered = Boolean(q || (cefr && cefr !== 'ALL'));

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header with Breadcrumb & Total Count */}
      <WordBankHeader totalCount={result.total} />

      {/* 2. Filter Bar with Search and CEFR Pills */}
      <WordBankFilterBar totalCount={result.total} />

      {/* 3. Word Bank List with Cards and Interactive Removal */}
      <main id="word-bank-content">
        <WordBankList
          initialItems={result.items}
          isFiltered={isFiltered}
        />
      </main>

      {/* 4. Accessible Server-Side Pagination */}
      {result.totalPages > 1 && (
        <nav aria-label="Phân trang sổ từ vựng" className="pt-4 flex justify-center">
          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            baseUrl="/word-bank"
            searchParams={{
              q,
              cefr: cefr !== 'ALL' ? cefr : undefined,
            }}
          />
        </nav>
      )}
    </div>
  );
}
