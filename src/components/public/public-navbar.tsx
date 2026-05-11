"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Disciplines", href: "#disciplines" },
  { label: "About", href: "#about" },
  { label: "Coaches", href: "#coaches" },
  { label: "Locations", href: "#locations" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? "bg-[#050505]/95 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
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
            <button
              key={link.label}
              onClick={() => handleNav(link.href)}
              className="nav-link px-3 py-2 text-xs font-bold uppercase tracking-widest"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="hidden rounded-full bg-csk-gold px-5 py-2 text-xs font-bold uppercase tracking-wider text-csk-black transition-all hover:bg-csk-goldLight hover:shadow-[0_0_20px_-5px_rgba(212,175,55,0.6)] sm:inline-block"
          >
            Member Login
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
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="w-full rounded-lg px-4 py-3 text-left text-sm font-bold uppercase tracking-wider text-white/70 transition-colors hover:bg-white/5 hover:text-csk-gold"
              >
                {link.label}
              </button>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block w-full rounded-full bg-csk-gold px-6 py-3 text-center text-sm font-bold uppercase tracking-wider text-csk-black"
              >
                Member Login
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
