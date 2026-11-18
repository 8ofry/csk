"use client";

import { useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROOT_DASHBOARDS = new Set([
  "/admin",
  "/head-coach",
  "/coach",
  "/intern",
  "/trainee",
]);

export function MobileNavDrawer({
  items,
}: {
  items: { href: string; label: string; labelKey?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Toggle navigation menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-csk-gold/40 bg-white/[0.03] text-csk-gold transition-colors hover:bg-csk-gold/15"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-csk-gold/20 bg-[#070709]/95 px-4 py-4 shadow-2xl backdrop-blur-xl">
          <nav className="flex flex-col gap-1 text-sm" aria-label="Mobile navigation">
            {items.map((item) => {
              const isActive = ROOT_DASHBOARDS.has(item.href)
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2.5 font-medium transition-colors",
                    isActive
                      ? "border border-csk-gold/30 bg-csk-gold/15 text-csk-gold"
                      : "text-white/85 hover:bg-csk-gold/10 hover:text-csk-gold",
                  )}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-csk-gold" />}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
