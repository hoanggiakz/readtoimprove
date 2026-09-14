import { NextRequest, NextResponse } from 'next/server';
import { suggestionsQuerySchema } from '@/validations/search';
import { getSearchSuggestions } from '@/lib/search';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('q') ?? '';

    const parseResult = suggestionsQuerySchema.safeParse({ q: rawQuery });
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: 'BAD_REQUEST',
          message: 'Từ khóa tìm kiếm tối thiểu 2 ký tự',
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Rate limiting: 120 requests / minute per IP for autocomplete suggestions
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous-suggestions';

    const rlResult = await rateLimit(`suggestions:${clientIp}`, 120);
    if (!rlResult.success) {
      return NextResponse.json(
        {
          error: 'TOO_MANY_REQUESTS',
          message: 'Quá nhiều yêu cầu gợi ý tìm kiếm.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rlResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const { q } = parseResult.data;
    const suggestions = await getSearchSuggestions(q, 5);

    return NextResponse.json(
      {
        suggestions,
        query: q,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err: unknown) {
    console.error('Search Suggestions API Error:', err);
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Đã xảy ra lỗi khi tải gợi ý tìm kiếm',
      },
      { status: 500 }
    );
  }
}
