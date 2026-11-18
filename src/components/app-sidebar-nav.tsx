"use client";

import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  DollarSign,
  Dumbbell,
  Eye,
  FileBarChart2,
  FileSignature,
  FileText,
  HeartPulse,
  Layers,
  LayoutDashboard,
  Loader2,
  MapPin,
  Repeat,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_BY_KEY: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  family: Users,
  schedule: CalendarDays,
  evaluations: ClipboardCheck,
  reports: BarChart3,
  payments: CreditCard,
  championships: Trophy,
  medical: HeartPulse,
  today: Clock,
  myGroups: Layers,
  groups: Layers,
  sessionPlans: FileText,
  privateSessions: UserCheck,
  earnings: Wallet,
  approvals: CheckCircle2,
  trainees: Users,
  users: Users,
  subscriptions: Repeat,
  merchandise: ShoppingBag,
  trainingUnits: Dumbbell,
  beltExams: Award,
  monthlyReports: FileBarChart2,
  certificates: ScrollText,
  locations: MapPin,
  contracts: FileSignature,
  financial: DollarSign,
  audit: ShieldCheck,
  settings: Settings,
  shadowedSessions: Eye,
  selfEvaluation: Sparkles,
};

const ROOT_DASHBOARDS = new Set([
  "/admin",
  "/head-coach",
  "/coach",
  "/intern",
  "/trainee",
]);

export interface AppNavItem {
  href: string;
  label: string;
  labelKey: string;
}

export function AppSidebarNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <>
      {pendingHref && (
        <div
          className="fixed inset-x-0 top-0 z-50 h-0.5 bg-gradient-to-r from-csk-gold/40 via-csk-gold to-csk-gold/40 animate-pulse"
          role="progressbar"
          aria-label="Loading page"
        />
      )}
      <nav className="flex flex-col gap-1 text-sm" aria-label="Workspace navigation">
        {items.map((item) => {
          const Icon = ICON_BY_KEY[item.labelKey] ?? LayoutDashboard;
          const isCurrent = ROOT_DASHBOARDS.has(item.href)
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isPending = pendingHref === item.href;
          const isHighlighted = pendingHref ? isPending : isCurrent;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => router.prefetch(item.href)}
              onClick={() => {
                if (!isCurrent) setPendingHref(item.href);
              }}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition-all duration-150",
                isHighlighted
                  ? "border border-csk-gold/30 bg-csk-gold/12 text-foreground shadow-xs"
                  : "border border-transparent text-foreground/70 hover:bg-muted/80 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isHighlighted
                    ? "text-csk-gold"
                    : "text-muted-foreground group-hover:text-csk-gold",
                )}
              />
              <span className="truncate">{item.label}</span>
              {isPending ? (
                <Loader2 className="ms-auto h-3.5 w-3.5 shrink-0 animate-spin text-csk-gold" />
              ) : (
                isHighlighted && (
                  <span
                    className="ms-auto h-1.5 w-1.5 shrink-0 rounded-full bg-csk-gold"
                    aria-hidden="true"
                  />
                )
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
