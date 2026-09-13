'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WordBankErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function WordBankError({ error, reset }: WordBankErrorProps) {
  useEffect(() => {
    console.error('Word Bank Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h1 className="text-xl font-bold text-foreground mb-2">
        Không thể tải Sổ từ vựng
      </h1>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        Đã có lỗi xảy ra trong quá trình truy xuất dữ liệu từ vựng cá nhân. Vui lòng thử tải lại trang hoặc kiểm tra kết nối mạng.
      </p>

      <Button onClick={() => reset()} className="gap-2 font-medium text-xs">
        <RefreshCw className="w-4 h-4" />
        <span>Thử lại</span>
      </Button>
    </div>
  );
}
