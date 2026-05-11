import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("nav");
  const tBrand = await getTranslations("brand");
  const tFooter = await getTranslations("publicSite.footer");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-csk-black text-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="text-csk-gold">⚔</span>
            <span>{tBrand("name")}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/" className="hover:text-csk-gold">
              {t("home")}
            </Link>
            <Link href="/locations" className="hover:text-csk-gold">
              {t("locations")}
            </Link>
            <Link href="/disciplines" className="hover:text-csk-gold">
              {t("disciplines")}
            </Link>
            <Link href="/coaches" className="hover:text-csk-gold">
              {t("coaches")}
            </Link>
            <Link href="/pricing" className="hover:text-csk-gold">
              {t("pricing")}
            </Link>
            <Link href="/contact" className="hover:text-csk-gold">
              {t("contact")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-csk-black hover:bg-csk-goldLight"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-csk-black text-white/70">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          <div>
            <h4 className="mb-2 font-semibold text-white">{tFooter("train")}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/disciplines" className="hover:text-csk-gold">
                  {t("disciplines")}
                </Link>
              </li>
              <li>
                <Link href="/schedule" className="hover:text-csk-gold">
                  {t("schedule")}
                </Link>
              </li>
              <li>
                <Link href="/coaches" className="hover:text-csk-gold">
                  {t("coaches")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-csk-gold">
                  {t("pricing")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-white">{tFooter("compete")}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/champions" className="hover:text-csk-gold">
                  {t("champions")}
                </Link>
              </li>
              <li>
                <Link href="/locations" className="hover:text-csk-gold">
                  {t("locations")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-white">{tFooter("shop")}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/merchandise" className="hover:text-csk-gold">
                  {t("merchandise")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-white">{tFooter("csk")}</h4>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/about" className="hover:text-csk-gold">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-csk-gold">
                  {t("blog")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-csk-gold">
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container py-4 text-center text-xs">{tFooter("rights")}</div>
        </div>
      </footer>
    </div>
  );
}
