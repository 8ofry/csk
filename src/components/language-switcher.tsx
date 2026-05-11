"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type Locale } from "@/i18n/config";

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale() as Locale;

  const next = locales.find((l) => l !== current) ?? current;

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="rounded-md border border-csk-gold/40 px-3 py-1 text-sm text-csk-gold hover:bg-csk-gold/10"
      aria-label="Switch language"
    >
      {localeLabels[next]}
    </button>
  );
}
