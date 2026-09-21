import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserStats } from '@/lib/queries/user-stats';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const timezone = searchParams.get('timezone') || 'Asia/Ho_Chi_Minh';

  try {
    const stats = await getUserStats(session.user.id, timezone);
    return NextResponse.json({ success: true, data: stats });
  } catch (err) {
    console.error('Error fetching user stats API:', err);
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR', message: 'Lỗi khi tải thống kê học tập.' },
      { status: 500 }
    );
  }
}
