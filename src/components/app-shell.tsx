import type { UserRole } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell, User } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { AppSidebarNav } from "@/components/app-sidebar-nav";
import { dashboardPathFor } from "@/lib/rbac";
import { unreadCount } from "@/application/notifications/inbox";
import { prisma } from "@/infrastructure/db/prisma";
import Image from "next/image";

interface NavItem {
  href: string;
  labelKey: string;
}

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { href: "/admin", labelKey: "dashboard" },
    { href: "/admin/locations", labelKey: "locations" },
    { href: "/admin/users", labelKey: "users" },
    { href: "/admin/contracts", labelKey: "contracts" },
    { href: "/admin/financial", labelKey: "financial" },
    { href: "/head-coach/subscriptions", labelKey: "subscriptions" },
    { href: "/admin/audit", labelKey: "audit" },
    { href: "/admin/settings", labelKey: "settings" },
  ],
  HEAD_COACH: [
    { href: "/head-coach", labelKey: "dashboard" },
    { href: "/head-coach/approvals", labelKey: "approvals" },
    { href: "/head-coach/trainees", labelKey: "trainees" },
    { href: "/head-coach/groups", labelKey: "groups" },
    { href: "/head-coach/subscriptions", labelKey: "subscriptions" },
    { href: "/head-coach/merchandise", labelKey: "merchandise" },
    { href: "/head-coach/training-units", labelKey: "trainingUnits" },
    { href: "/head-coach/belt-exams", labelKey: "beltExams" },
    { href: "/head-coach/monthly-reports", labelKey: "monthlyReports" },
    { href: "/head-coach/certificates", labelKey: "certificates" },
    { href: "/head-coach/championships", labelKey: "championships" },
    { href: "/head-coach/medical", labelKey: "medical" },
  ],
  COACH: [
    { href: "/coach", labelKey: "dashboard" },
    { href: "/coach/today", labelKey: "today" },
    { href: "/coach/groups", labelKey: "myGroups" },
    { href: "/coach/session-plans", labelKey: "sessionPlans" },
    { href: "/coach/private-sessions", labelKey: "privateSessions" },
    { href: "/coach/earnings", labelKey: "earnings" },
    { href: "/coach/championships", labelKey: "championships" },
  ],
  INTERN: [
    { href: "/intern", labelKey: "dashboard" },
    { href: "/intern/sessions", labelKey: "shadowedSessions" },
    { href: "/intern/training-units", labelKey: "trainingUnits" },
    { href: "/intern/self-evaluation", labelKey: "selfEvaluation" },
  ],
  TRAINEE: [
    { href: "/trainee", labelKey: "dashboard" },
    { href: "/trainee/family", labelKey: "family" },
    { href: "/trainee/schedule", labelKey: "schedule" },
    { href: "/trainee/evaluations", labelKey: "evaluations" },
    { href: "/trainee/reports", labelKey: "reports" },
    { href: "/trainee/payments", labelKey: "payments" },
    { href: "/trainee/championships", labelKey: "championships" },
    { href: "/trainee/medical", labelKey: "medical" },
  ],
};

export async function AppShell({
  userId,
  role,
  userName,
  children,
}: {
  userId?: string;
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const [t, tNav, tRoles, locale, unread, profile] = await Promise.all([
    getTranslations("nav"),
    getTranslations("appNav"),
    getTranslations("roles"),
    getLocale(),
    userId ? unreadCount(userId).catch(() => 0) : Promise.resolve(0),
    userId
      ? prisma.user
          .findUnique({
            where: { id: userId },
            select: { fullNameEn: true, fullNameAr: true, profilePhotoUrl: true },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);
  const displayName =
    locale === "ar"
      ? profile?.fullNameAr || userName
      : profile?.fullNameEn || userName;
  const items = NAV_BY_ROLE[role].map((it) => ({
    href: it.href,
    label: tNav(it.labelKey),
    labelKey: it.labelKey,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/35 via-background to-background">
      <header className="sticky top-0 z-40 border-b border-csk-gold/20 bg-[#070709]/95 text-white shadow-md backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MobileNavDrawer items={items} />
            <Link href={dashboardPathFor(role)} className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="CSK Academy"
                width={72}
                height={36}
                className="object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.25)]"
                priority
              />
              <span className="ms-1 rounded-full border border-csk-gold/30 bg-csk-gold/15 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-csk-gold">
                {tRoles(role.toLowerCase())}
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-csk-gold/30 bg-white/[0.03] text-white/80 transition-colors hover:bg-csk-gold/15 hover:text-csk-gold"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-csk-gold px-1 text-[10px] font-bold text-black shadow-sm">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <Link
              href="/profile"
              title={locale === "ar" ? "تحديث الملف الشخصي" : "Update profile photo"}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pe-3 ps-1.5 transition-colors hover:border-csk-gold/40 hover:bg-csk-gold/10 md:flex"
            >
              {profile?.profilePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePhotoUrl}
                  alt={displayName}
                  className="h-6 w-6 rounded-full border border-csk-gold/50 object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-csk-gold/40 bg-csk-gold/15 text-csk-gold">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
              <span className="text-sm font-medium text-white/90">{displayName}</span>
            </Link>
            <LanguageSwitcher />
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-lg border border-csk-gold/40 px-3 py-1.5 text-xs font-semibold text-csk-gold transition-colors hover:bg-csk-gold/15"
              >
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-csk-gold/40 to-transparent" />
      </header>

      <div className="container flex flex-1 gap-6 py-6">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-20 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-sm backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tRoles(role.toLowerCase())}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" title="Online" />
            </div>
            <AppSidebarNav items={items} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
