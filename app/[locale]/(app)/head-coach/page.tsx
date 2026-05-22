import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isAtLeast } from "@/lib/rbac";
import { prisma } from "@/infrastructure/db/prisma";
import { Link } from "@/i18n/navigation";

export default async function HeadCoachDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (!session || !isAtLeast(session.user.role, "HEAD_COACH")) {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("dashboards.headCoach");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [pendingPlans, pendingReports, expiringDocs, todaysSessions] = await Promise.all([
    prisma.sessionPlan.findMany({
      where: { status: "PENDING" },
      include: {
        group: true,
        createdBy: { select: { fullNameEn: true, fullNameAr: true } },
      },
      orderBy: { sessionDate: "asc" },
    }),
    prisma.dailyReport.findMany({
      where: { status: "PENDING" },
      include: {
        group: true,
        coach: { select: { fullNameEn: true, fullNameAr: true } },
      },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.medicalDocument.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: {
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        trainee: { select: { fullNameEn: true, fullNameAr: true } },
      },
      orderBy: { expiryDate: "asc" },
    }),
    prisma.session.findMany({
      where: {
        scheduledStart: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        group: true,
        location: true,
        coach: { select: { fullNameEn: true, fullNameAr: true } },
      },
      orderBy: { scheduledStart: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title={t("panels.pendingPlans")} empty={t("noData")} count={pendingPlans.length}>
          {pendingPlans.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
              <div>
                <Link href={`/head-coach/approvals`} className="font-medium text-csk-gold hover:underline">
                  {p.group.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {locale === "ar" ? "بواسطة: " : "By: "} {locale === "ar" ? p.createdBy.fullNameAr : p.createdBy.fullNameEn}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-end">
                {p.sessionDate.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title={t("panels.pendingReports")} empty={t("noData")} count={pendingReports.length}>
          {pendingReports.map((r) => (
            <div key={r.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
              <div>
                <Link href={`/head-coach/approvals`} className="font-medium text-csk-gold hover:underline">
                  {r.group.name}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {locale === "ar" ? "بواسطة: " : "By: "} {locale === "ar" ? r.coach.fullNameAr : r.coach.fullNameEn}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-end">
                {r.submittedAt?.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, { month: "short", day: "numeric" }) ?? "—"}
              </div>
            </div>
          ))}
        </Panel>

        <Panel title={t("panels.expiringDocs")} empty={t("noData")} count={expiringDocs.length}>
          {expiringDocs.map((d) => {
            const isExpired = d.expiryDate < new Date();
            return (
              <div key={d.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
                <div>
                  <div className="font-medium text-foreground">
                    {locale === "ar" ? d.trainee.fullNameAr : d.trainee.fullNameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {d.documentType}
                  </div>
                </div>
                <div className="text-xs text-end">
                  <span className={isExpired ? "text-destructive font-semibold" : "text-amber-500 font-semibold"}>
                    {isExpired ? (locale === "ar" ? "منتهية" : "Expired") : (locale === "ar" ? "تنتهي قريباً" : "Expiring")}
                  </span>
                  <div className="text-muted-foreground text-xs">
                    {d.expiryDate.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel title={t("panels.todaysSessions")} empty={t("noData")} count={todaysSessions.length}>
          {todaysSessions.map((s) => {
            const startTime = s.scheduledStart.toLocaleTimeString(locale === "ar" ? "ar-EG" : undefined, { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={s.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
                <div>
                  <div className="font-medium text-foreground">{s.group.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.location.nameEn} · {locale === "ar" ? s.coach.fullNameAr : s.coach.fullNameEn}
                  </div>
                </div>
                <div className="text-xs text-csk-gold font-semibold text-end">
                  {startTime}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  empty,
  count,
}: {
  title: string;
  children?: React.ReactNode;
  empty: string;
  count?: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-muted">
        <h2 className="font-semibold text-lg text-foreground">{title}</h2>
        {count !== undefined && count > 0 && (
          <span className="bg-csk-gold text-csk-black text-xs font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1">
        {count && count > 0 ? (
          <div className="space-y-3">{children}</div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>
        )}
      </div>
    </div>
  );
}

