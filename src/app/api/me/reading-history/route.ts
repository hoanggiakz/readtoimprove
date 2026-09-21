import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { historyQuerySchema } from '@/validations/user-history';
import { getUserReadingHistory } from '@/lib/queries/user-history';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    page: searchParams.get('page') || 1,
    limit: searchParams.get('limit') || 10,
    category: searchParams.get('category') || undefined,
    level: searchParams.get('level') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'INVALID_QUERY', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const data = await getUserReadingHistory(session.user.id, parsed.data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching reading history API:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Lỗi khi tải lịch sử đọc.' },
      { status: 500 }
    );
  }
}
