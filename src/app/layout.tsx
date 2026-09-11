import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ReadToImprove — Đọc Báo Song Ngữ Anh-Việt Nâng Cao Trình Độ",
    template: "%s | ReadToImprove",
  },
  description:
    "Nền tảng đọc tin tức song ngữ Anh–Việt thông minh. Đối chiếu câu song song, giải nghĩa từ vựng chuyên sâu và phân loại cấp độ CEFR chuẩn quốc tế.",
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
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: "ReadToImprove — Đọc Báo Song Ngữ Anh-Việt",
    description: "Nâng cao kỹ năng đọc hiểu và vốn từ vựng học thuật qua tin tức quốc tế song ngữ Anh–Việt.",
    siteName: "ReadToImprove",
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
