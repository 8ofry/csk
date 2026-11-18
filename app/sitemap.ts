import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://cskacademy.com"
  ).replace(/\/$/, "");

  const publicPaths = [
    "",
    "/about",
    "/blog",
    "/championships",
    "/championships/register",
    "/coaches",
    "/contact",
    "/disciplines",
    "/fighters",
    "/locations",
    "/merchandise",
    "/pricing",
    "/schedule",
  ];

  const entries: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    for (const p of publicPaths) {
      entries.push({
        url: `${baseUrl}/${locale}${p}`,
        lastModified: new Date(),
        changeFrequency: p === "" ? "weekly" : "monthly",
        priority: p === "" ? 1.0 : 0.7,
      });
    }
  }
  return entries;
}
