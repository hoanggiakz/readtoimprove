import React from 'react';
import type { Metadata } from 'next';
import { requireAuth } from '@/lib/security';
import { MeNavTabs } from '@/components/me/me-nav-tabs';

export const metadata: Metadata = {
  title: 'Trang cá nhân | ReadToImprove',
  description: 'Quản lý lịch sử đọc, bài viết đã lưu, tiến độ học tập và sổ từ vựng cá nhân.',
  robots: {
    index: false,
    follow: false,
  },
};


export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated before rendering any /me page
  await requireAuth('/me');

  return (
    <div className="min-h-screen bg-muted/20">
      <MeNavTabs />
      <main className="container mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
