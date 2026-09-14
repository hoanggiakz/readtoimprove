import { NextRequest, NextResponse } from 'next/server';
import { searchParamsSchema } from '@/validations/search';
import { searchPublicArticles } from '@/lib/search';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = {
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      level: searchParams.get('level') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    };

    const parseResult = searchParamsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'BAD_REQUEST',
          message: 'Tham số tìm kiếm không hợp lệ',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Rate limiting: 60 requests / minute per IP
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-search';

    const rlResult = await rateLimit(`search:${clientIp}`, 60);
    if (!rlResult.success) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_REQUESTS',
          message: 'Bạn đã gửi quá nhiều yêu cầu tìm kiếm. Vui lòng thử lại sau giây lát.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const { q, category, level, page, limit } = parseResult.data;

    const result = await searchPublicArticles({
      q,
      categorySlug: category,
      cefrLevel: level,
      page,
      pageSize: limit,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (err: unknown) {
    console.error('Search API Error:', err);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi khi tìm kiếm bài viết',
      },
      { status: 500 }
    );
  }
}
