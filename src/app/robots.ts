import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const adminPath = process.env.ADMIN_ROUTE_PATH || "/secure-console-x7";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [`${adminPath}/*`, `${adminPath}`, "/api/admin/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
