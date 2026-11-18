import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://cskacademy.com"
  ).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/head-coach/", "/coach/", "/intern/", "/trainee/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
