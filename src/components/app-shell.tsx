import type { UserRole } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { dashboardPathFor } from "@/lib/rbac";
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
    { href: "/head-coach/coaches", labelKey: "coaches" },
    { href: "/head-coach/groups", labelKey: "groups" },
    { href: "/head-coach/subscriptions", labelKey: "subscriptions" },
    { href: "/head-coach/merchandise", labelKey: "merchandise" },
    { href: "/admin/financial", labelKey: "financial" },
    { href: "/head-coach/training-units", labelKey: "trainingUnits" },
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
  ],
  INTERN: [
    { href: "/intern", labelKey: "dashboard" },
    { href: "/intern/sessions", labelKey: "shadowedSessions" },
    { href: "/intern/training-units", labelKey: "trainingUnits" },
    { href: "/intern/self-evaluation", labelKey: "selfEvaluation" },
  ],
  TRAINEE: [
    { href: "/trainee", labelKey: "dashboard" },
    { href: "/trainee/schedule", labelKey: "schedule" },
    { href: "/trainee/evaluations", labelKey: "evaluations" },
    { href: "/trainee/reports", labelKey: "reports" },
    { href: "/trainee/payments", labelKey: "payments" },
    { href: "/trainee/championships", labelKey: "championships" },
    { href: "/trainee/medical", labelKey: "medical" },
  ],
};

export async function AppShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");
  const tNav = await getTranslations("appNav");
  const tRoles = await getTranslations("roles");
  const items = NAV_BY_ROLE[role];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-csk-black text-white">
        <div className="container flex h-16 items-center justify-between">
          <Link href={dashboardPathFor(role)} className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="CSK Academy"
              width={72}
              height={36}
              className="object-contain"
              priority
            />
            <span className="ms-1 rounded bg-csk-gold/20 px-2 py-0.5 text-xs font-medium text-csk-gold">
              {tRoles(role.toLowerCase())}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/80 md:block">{userName}</span>
            <LanguageSwitcher />
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md border border-csk-gold/40 px-3 py-1 text-sm text-csk-gold hover:bg-csk-gold/10"
              >
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="container flex flex-1 gap-6 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="flex flex-col gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-foreground/80 hover:bg-csk-gold/10 hover:text-csk-gold"
              >
                {tNav(item.labelKey)}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
