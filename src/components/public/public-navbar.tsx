"use client";

import { Link, useRouter, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Disciplines", href: "#disciplines" },
  { label: "Championships", href: "/championships" },
  { label: "Fighters & Rankings", href: "/champions" },
  { label: "About", href: "#about" },
  { label: "Coaches", href: "#coaches" },
  { label: "Locations", href: "#locations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      if (pathname === "/") {
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        router.push(`/${href}` as Parameters<typeof router.push>[0]);
      }
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-700 ${
        scrolled
          ? "bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-12 w-32">
            <Image
              src="/images/logo.png"
              alt="CSK Academy"
              fill
              className="object-contain object-left drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]"
              priority
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            link.href.startsWith("#") ? (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="nav-link px-3 py-2 text-xs font-bold uppercase tracking-widest"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.href as Parameters<typeof Link>[0]["href"]}
                className="nav-link px-3 py-2 text-xs font-bold uppercase tracking-widest"
              >
                {link.label}
              </Link>
            )
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="group relative hidden overflow-hidden rounded-full bg-csk-gold px-6 py-2.5 text-xs font-black uppercase tracking-wider text-csk-black transition-all hover:scale-105 hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.6)] sm:inline-flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
            <span className="relative z-10">Member Login</span>
          </Link>
          {/* Mobile burger */}
          <button
            className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-white lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#050505]/98 backdrop-blur-xl lg:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              link.href.startsWith("#") ? (
                <button
                  key={link.label}
                  onClick={() => handleNav(link.href)}
                  className="w-full rounded-lg px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/5 hover:text-csk-gold"
                >
                  {link.label}
                </button>
              ) : (
                <Link
                  key={link.label}
                  href={link.href as Parameters<typeof Link>[0]["href"]}
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/5 hover:text-csk-gold"
                >
                  {link.label}
                </Link>
              )
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="group relative block w-full overflow-hidden rounded-full bg-csk-gold px-6 py-3 text-center text-sm font-black uppercase tracking-wider text-csk-black transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative z-10">Member Login</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
