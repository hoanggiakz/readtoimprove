export type Theme = "light" | "dark" | "system";

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "ReadToImprove",
  description: "Nền tảng đọc báo song ngữ Anh - Việt nâng cao trình độ tiếng Anh qua tin tức quốc tế.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    github: "https://github.com",
  },
};
