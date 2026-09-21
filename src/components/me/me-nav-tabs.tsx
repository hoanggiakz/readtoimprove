'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  History,
  Heart,
  Bookmark,
} from 'lucide-react';

const tabs = [
  {
    href: '/me',
    label: 'Tổng quan',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/me/progress',
    label: 'Tiến độ & Thống kê',
    icon: TrendingUp,
    exact: false,
  },
  {
    href: '/me/reading-history',
    label: 'Lịch sử đọc',
    icon: History,
    exact: false,
  },
  {
    href: '/me/favorites',
    label: 'Bài viết đã lưu',
    icon: Heart,
    exact: false,
  },
  {
    href: '/word-bank',
    label: 'Sổ từ vựng',
    icon: Bookmark,
    exact: false,
  },
];

export function MeNavTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border/80 bg-background/95 sticky top-16 z-30 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6">
        <nav
          className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2 scrollbar-none"
          aria-label="Điều hướng trang cá nhân"
        >
          {tabs.map((tab) => {
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
