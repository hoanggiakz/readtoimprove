'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LogOut,
  Bookmark,
  History,
  Heart,
  TrendingUp,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';
import { logoutAction } from '@/lib/actions/auth';

interface UserDropdownMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export function UserDropdownMenu({ user }: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        id="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Tài khoản cá nhân"
        className="flex items-center gap-2 rounded-full border border-border/60 bg-background/50 p-1 sm:px-2.5 sm:py-1 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-xs">
          {initials}
        </div>
        <span className="hidden sm:inline-block max-w-[110px] truncate text-xs font-semibold">
          {user.name}
        </span>
        <ChevronDown className="hidden sm:inline-block h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg focus:outline-none z-50 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* User Profile Header */}
          <div className="border-b border-border/60 px-3 py-2.5">
            <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {user.role === 'ADMIN' && (
              <span className="mt-1.5 inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Quản trị viên
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="py-1">
            <Link
              href="/me"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              <span>Trang cá nhân</span>
            </Link>

            <Link
              href="/me/progress"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              role="menuitem"
            >
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Tiến độ học tập</span>
            </Link>

            <Link
              href="/me/reading-history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              role="menuitem"
            >
              <History className="h-4 w-4 text-muted-foreground" />
              <span>Lịch sử đọc</span>
            </Link>

            <Link
              href="/me/favorites"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              role="menuitem"
            >
              <Heart className="h-4 w-4 text-rose-500" />
              <span>Bài viết đã lưu</span>
            </Link>

            <Link
              href="/word-bank"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              role="menuitem"
            >
              <Bookmark className="h-4 w-4 text-amber-500" />
              <span>Sổ từ vựng</span>
            </Link>
          </div>

          {/* Logout Action */}
          <div className="border-t border-border/60 pt-1">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                <span>Đăng xuất</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
