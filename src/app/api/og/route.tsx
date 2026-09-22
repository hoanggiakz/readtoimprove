import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'ReadToImprove — Đọc Báo Song Ngữ Anh–Việt';
    const category = searchParams.get('category') || 'Bilingual News';
    const level = (searchParams.get('level') || 'B2').toUpperCase();
    const readingTime = searchParams.get('readingTime') || '5 min read';

    // CEFR badge color palette
    const cefrColors: Record<string, { bg: string; text: string; border: string }> = {
      A1: { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
      A2: { bg: '#064e3b', text: '#6ee7b7', border: '#047857' },
      B1: { bg: '#065f46', text: '#a7f3d0', border: '#059669' },
      B2: { bg: '#1e3a8a', text: '#93c5fd', border: '#2563eb' },
      C1: { bg: '#4c1d95', text: '#c4b5fd', border: '#7c3aed' },
      C2: { bg: '#831843', text: '#fbcfe8', border: '#db2777' },
    };

    const currentCefr = cefrColors[level] || cefrColors.B2;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#090d16',
            backgroundImage:
              'radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(37, 99, 235, 0.1) 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            color: '#f8fafc',
          }}
        >
          {/* Top Brand Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '28px',
                  fontWeight: 800,
                  boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.5)',
                }}
              >
                R
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    letterSpacing: '-0.03em',
                    color: '#ffffff',
                  }}
                >
                  ReadToImprove
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#94a3b8',
                    letterSpacing: '0.02em',
                  }}
                >
                  Bilingual English–Vietnamese News
                </span>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  backgroundColor: currentCefr.bg,
                  border: `2px solid ${currentCefr.border}`,
                  color: currentCefr.text,
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                }}
              >
                CEFR {level}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  color: '#cbd5e1',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {category}
              </div>
            </div>
          </div>

          {/* Main Title Area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              maxWidth: '1040px',
            }}
          >
            <h1
              style={{
                fontSize: title.length > 80 ? '48px' : '56px',
                fontWeight: 900,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '22px',
                color: '#94a3b8',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              Đọc báo song ngữ câu đối câu · Tra từ vựng học thuật ngữ cảnh · Chuẩn CEFR
            </p>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #1e293b',
              paddingTop: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
                Thời gian đọc: {readingTime}
              </span>
              <span style={{ fontSize: '16px', color: '#64748b' }}>•</span>
              <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 500 }}>
                Phát âm & Giải nghĩa chi tiết
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#3b82f6',
                  letterSpacing: '0.02em',
                }}
              >
                readtoimprove.com
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control':
            'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[OG Image Error]', error);
    return new Response('Failed to generate Open Graph image', { status: 500 });
  }
}
