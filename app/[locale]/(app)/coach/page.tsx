import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { isAtLeast } from "@/lib/rbac";
import { prisma } from "@/infrastructure/db/prisma";
import { coachEarnings } from "@/application/financial/dashboards";
import { Link } from "@/i18n/navigation";

export default async function CoachDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (!session || !session.user || !isAtLeast(session.user.role, "COACH")) {
    redirect({ href: "/", locale });
    return null;
  }

  const coachUserId = session.user.id;
  const t = await getTranslations("dashboards.coach");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todaysSessions, earnings, rejectedPlans, privateSessions] = await Promise.all([
    prisma.session.findMany({
      where: {
        coachId: coachUserId,
        scheduledStart: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        group: true,
        location: true,
      },
      orderBy: {
        scheduledStart: "asc",
      },
    }),
    coachEarnings(coachUserId, { from: startOfMonth, to: new Date() }),
    prisma.sessionPlan.findMany({
      where: {
        createdById: coachUserId,
        status: "REJECTED",
      },
      include: {
        group: true,
      },
      orderBy: {
        sessionDate: "desc",
      },
    }),
    prisma.privateSession.findMany({
      where: {
        coachId: coachUserId,
        scheduledStart: {
          gte: todayStart,
        },
      },
      include: {
        trainee: { select: { fullNameEn: true, fullNameAr: true } },
        location: true,
      },
      orderBy: {
        scheduledStart: "asc",
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title={t("panels.todaysSessions")} empty={t("noData")} count={todaysSessions.length}>
          {todaysSessions.map((s) => {
            const startTime = s.scheduledStart.toLocaleTimeString(locale === "ar" ? "ar-EG" : undefined, { hour: "2-digit", minute: "2-digit" });
            return (
              <div key={s.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
                <div>
                  <Link href={`/coach/sessions/${s.id}`} className="font-medium text-csk-gold hover:underline">
                    {s.group.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {locale === "ar" ? s.location.nameAr : s.location.nameEn} · {s.status}
                  </div>
                </div>
                <div className="text-xs text-csk-gold font-semibold text-end">
                  {startTime}
                </div>
              </div>
            );
          })}
        </Panel>

        <Panel title={t("panels.mtdEarnings")} empty={t("noData")} count={earnings.total > 0 ? 1 : 0}>
          <div className="space-y-4">
            <div className="text-3xl font-bold text-csk-gold">
              {earnings.total.toLocaleString(locale === "ar" ? "ar-EG" : undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP
            </div>
            {earnings.transactions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {locale === "ar" ? "آخر العمليات" : "Recent Splits"}
                </div>
                {earnings.transactions.slice(0, 3).map((tx) => (
                  <div key={tx.paymentId} className="flex justify-between text-xs p-1 bg-muted/20 rounded">
                    <div>
                      <span className="font-medium text-foreground">{tx.revenueType}</span>
                      <span className="text-muted-foreground ml-1">({tx.percent}%)</span>
                    </div>
                    <div className="font-semibold text-csk-gold">
                      +{tx.amount.toFixed(2)} EGP
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/coach/earnings" className="text-xs text-muted-foreground hover:underline block text-center mt-2 border-t pt-2">
              {locale === "ar" ? "عرض جميع الأرباح" : "View all earnings"}
            </Link>
          </div>
        </Panel>

        <Panel title={t("panels.rejectedPlans")} empty={t("noData")} count={rejectedPlans.length}>
          {rejectedPlans.map((p) => (
            <div key={p.id} className="flex flex-col text-sm p-2 hover:bg-muted/40 rounded transition-colors border border-destructive/20 bg-destructive/5">
              <div className="flex justify-between items-center">
                <Link href={`/coach/session-plans/${p.id}`} className="font-medium text-csk-gold hover:underline">
                  {p.group.name}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {p.sessionDate.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
              {p.rejectionComment && (
                <div className="mt-1 text-xs text-destructive bg-destructive/10 p-1.5 rounded">
                  <strong className="font-semibold">{locale === "ar" ? "سبب الرفض: " : "Reason: "}</strong>
                  {p.rejectionComment}
                </div>
              )}
            </div>
          ))}
        </Panel>

        <Panel title={t("panels.privateRequests")} empty={t("noData")} count={privateSessions.length}>
          {privateSessions.map((s) => {
            const startTime = s.scheduledStart.toLocaleTimeString(locale === "ar" ? "ar-EG" : undefined, { hour: "2-digit", minute: "2-digit" });
            const dateStr = s.scheduledStart.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, { month: "short", day: "numeric" });
            return (
              <div key={s.id} className="flex justify-between items-center text-sm p-2 hover:bg-muted/40 rounded transition-colors">
                <div>
                  <div className="font-medium text-foreground">
                    {locale === "ar" ? s.trainee.fullNameAr : s.trainee.fullNameEn}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {locale === "ar" ? s.location.nameAr : s.location.nameEn} · {s.status}
                  </div>
                </div>
                <div className="text-xs text-end">
                  <div className="text-csk-gold font-semibold">{startTime}</div>
                  <div className="text-muted-foreground text-xs">{dateStr}</div>
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
        {children && (count === undefined || count > 0) ? (
          <div className="space-y-3">{children}</div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">{empty}</p>
        )}
      </div>
    </div>
  );
}
