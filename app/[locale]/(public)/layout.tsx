import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { PublicNavbar } from "@/components/public/public-navbar";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const tFooter = await getTranslations("publicSite.footer");
  const t = await getTranslations("nav");

  return (
    <div className="flex min-h-screen flex-col bg-[#050505]">
      <PublicNavbar />

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 bg-[#030303]">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="mb-4 flex items-center gap-3">
                <div className="relative h-10 w-10">
                  <Image
                    src="/images/logo.png"
                    alt="CSK Academy"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-white">
                  CSK <span className="text-csk-gold">Academy</span>
                </span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Elite combat sports training in Benha, Egypt. Forging champions since day one.
              </p>
            </div>

            {/* Train */}
            <div>
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-csk-gold">{tFooter("train")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><a href="#disciplines" className="hover:text-csk-gold transition-colors">{t("disciplines")}</a></li>
                <li><Link href="/schedule" className="hover:text-csk-gold transition-colors">{t("schedule")}</Link></li>
                <li><a href="#coaches" className="hover:text-csk-gold transition-colors">{t("coaches")}</a></li>
                <li><a href="#pricing" className="hover:text-csk-gold transition-colors">{t("pricing")}</a></li>
              </ul>
            </div>

            {/* Compete */}
            <div>
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-csk-gold">{tFooter("compete")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/champions" className="hover:text-csk-gold transition-colors">{t("champions")}</Link></li>
                <li><a href="#locations" className="hover:text-csk-gold transition-colors">{t("locations")}</a></li>
              </ul>
            </div>

            {/* CSK */}
            <div>
              <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-csk-gold">{tFooter("csk")}</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/about" className="hover:text-csk-gold transition-colors">{t("about")}</Link></li>
                <li><Link href="/merchandise" className="hover:text-csk-gold transition-colors">{t("merchandise")}</Link></li>
                <li><a href="#contact" className="hover:text-csk-gold transition-colors">{t("contact")}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-white/30">{tFooter("rights")}</p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs text-white/30 hover:text-csk-gold transition-colors">Member Portal</Link>
              <Link href="/register" className="text-xs text-white/30 hover:text-csk-gold transition-colors">Join Now</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
