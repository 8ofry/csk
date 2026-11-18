import { auth } from "@/auth";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/db/prisma";

export default async function InternDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (!session || session.user.role !== "INTERN") {
    redirect({ href: "/", locale });
    return null;
  }

  const userId = session.user.id;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [t, assignment, shadowedToday, latestEval, totalShadowed, totalSelfEvals] = await Promise.all([
    getTranslations("dashboards.intern"),
    prisma.internAssignment.findFirst({
      where: { internId: userId, active: true },
      include: { coach: { select: { fullNameEn: true, fullNameAr: true } } },
    }),
    prisma.session.findMany({
      where: { internId: userId, scheduledStart: { gte: todayStart } },
      include: { group: { select: { name: true } } },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
    prisma.detailedEvaluation.findFirst({
      where: { evaluatorId: userId, traineeId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.session.count({ where: { internId: userId } }),
    prisma.detailedEvaluation.count({ where: { evaluatorId: userId, traineeId: userId } }),
  ]);

  const readinessPct = Math.min(
    100,
    Math.round(((Math.min(totalShadowed, 20) / 20) * 0.7 + (Math.min(totalSelfEvals, 10) / 10) * 0.3) * 100),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="rounded-lg border border-csk-gold/30 bg-card p-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Coaching Readiness Progress</span>
          <span className="font-bold text-csk-gold">{readinessPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-csk-gold transition-all" style={{ width: `${readinessPct}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {totalShadowed}/20 Shadowed Sessions · {totalSelfEvals}/10 Self-Evaluations
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <h2 className="font-semibold">{t("panels.assignedCoach")}</h2>
          {assignment ? (
            <p className="text-sm font-medium">
              {locale === "ar" ? assignment.coach.fullNameAr : assignment.coach.fullNameEn}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.shadowedToday")}</h2>
            <Link href="/intern/sessions" className="text-xs text-csk-gold hover:underline">
              All sessions
            </Link>
          </div>
          {shadowedToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {shadowedToday.map((s) => (
                <li key={s.id}>
                  {s.group.name} · {s.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.selfEvalStatus")}</h2>
            <Link href="/intern/self-evaluation" className="text-xs text-csk-gold hover:underline">
              Open
            </Link>
          </div>
          {latestEval ? (
            <p className="text-sm text-muted-foreground">
              Last submitted: {latestEval.createdAt.toLocaleDateString()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
