import { revalidatePath } from "next/cache";
import { locales } from "@/i18n/config";

/**
 * Invalidate Next.js App Router cache across every configured locale prefix
 * (e.g. "/admin/users" -> "/ar/admin/users", "/en/admin/users").
 */
export function revalidateLocalized(pathWithoutLocale: string): void {
  const normalized = pathWithoutLocale.startsWith("/")
    ? pathWithoutLocale
    : `/${pathWithoutLocale}`;
  for (const locale of locales) {
    revalidatePath(`/${locale}${normalized}`);
  }
}
