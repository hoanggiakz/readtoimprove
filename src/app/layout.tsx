import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WebVitals } from "@/components/analytics/web-vitals";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const defaultTitle = "ReadToImprove — Đọc Báo Song Ngữ Anh-Việt Nâng Cao Trình Độ";
const defaultDescription =
  "Nền tảng đọc tin tức song ngữ Anh–Việt thông minh. Đối chiếu câu song song, giải nghĩa từ vựng chuyên sâu và phân loại cấp độ CEFR chuẩn quốc tế.";

export const metadata: Metadata = {
  title: {
    default: defaultTitle,
    template: "%s | ReadToImprove",
  },
  description: defaultDescription,
  keywords: [
    "đọc báo song ngữ",
    "học tiếng anh qua tin tức",
    "bilingual news",
    "read to lead",
    "từ vựng ielts",
    "từ vựng toefl",
    "cefr vocabulary",
  ],
  authors: [{ name: "ReadToImprove Editorial Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: defaultTitle,
    description: defaultDescription,
    siteName: "ReadToImprove",
    images: [
      {
        url: "/api/og?title=ReadToImprove&level=B2&category=News",
        width: 1200,
        height: 630,
        alt: "ReadToImprove — Đọc Báo Song Ngữ Anh-Việt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: ["/api/og?title=ReadToImprove&level=B2&category=News"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased selection:bg-primary/20 selection:text-primary">
        <WebVitals />
        {/* Skip to Content for WCAG Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg outline-none ring-2 ring-primary ring-offset-2"
        >
          Chuyển đến nội dung chính
        </a>
        {children}
      </body>
    </html>
  );
}

