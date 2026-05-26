import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listScheduledForCoach } from "@/application/sessions/service";
import { listGroups } from "@/application/groups/service";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartSessionButton } from "@/components/coach/start-session-button";

export default async function CoachSessionsPage() {
  const user = await requireRole("COACH");
  const today = new Date();
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // Past: last 30 days (excluding today)
  const pastStart = new Date(todayStart);
  pastStart.setDate(pastStart.getDate() - 30);
  const pastEnd = new Date(todayStart);
  pastEnd.setMilliseconds(pastEnd.getMilliseconds() - 1);

  const [t, tBadges, locale, todayOccurrences, allGroups, pastSessions] = await Promise.all([
    getTranslations("coachToday"),
    getTranslations("badges"),
    getLocale(),
    listScheduledForCoach(user.id, todayStart, todayEnd),
    listGroups({ coachId: user.id }),
    // Materialized sessions from the last 30 days
    prisma.session.findMany({
      where: {
        coachId: user.id,
        scheduledStart: { gte: pastStart, lte: pastEnd },
      },
      include: {
        group: { select: { name: true } },
        dailyReport: { select: { id: true, status: true } },
      },
      orderBy: { scheduledStart: "desc" },
    }),
  ]);

  const dateLabel = today.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const occurrencesByGroupId = new Map(todayOccurrences.map((o) => [o.groupId, o]));

  const statusVariant = (s: string) => {
    if (s === "COMPLETED") return "success" as const;
    if (s === "IN_PROGRESS") return "warning" as const;
    return "secondary" as const;
  };

  const reportBadge = (status: string | undefined) => {
    if (!status) return null;
    if (status === "APPROVED") return <Badge variant="success" className="text-[10px]">{tBadges("approved")}</Badge>;
    if (status === "PENDING") return <Badge variant="warning" className="text-[10px]">{tBadges("submitted")}</Badge>;
    if (status === "REJECTED") return <Badge variant="destructive" className="text-[10px]">{tBadges("rejected")}</Badge>;
    return <Badge variant="secondary" className="text-[10px]">{tBadges("draft")}</Badge>;
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {locale === "ar" ? "الحصص التدريبية" : "Sessions"}
        </h1>
        <p className="text-muted-foreground">{dateLabel}</p>
      </div>

      {/* ─── SECTION 1: Today ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-csk-gold animate-pulse" />
          {locale === "ar" ? "حصص اليوم المجدولة" : "Today's Scheduled Sessions"}
        </h2>

        {todayOccurrences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("noSessions")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {todayOccurrences.map((o) => (
              <Card key={`${o.groupId}-${o.scheduledStart.toISOString()}`} className="border-l-4 border-l-csk-gold">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{o.groupName}</span>
                    {o.status === "IN_PROGRESS" && <Badge variant="warning">{tBadges("inProgress")}</Badge>}
                    {o.status === "COMPLETED" && <Badge variant="success">{tBadges("completed")}</Badge>}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {o.locationName} ·{" "}
                    {o.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                    – {o.scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </CardHeader>
                <CardContent>
                  {o.sessionId ? (
                    <Link
                      href={`/coach/sessions/${o.sessionId}`}
                      className="inline-flex h-11 items-center rounded-md bg-csk-gold px-6 text-base font-semibold text-csk-black hover:bg-csk-goldLight transition-all"
                    >
                      {t("openSession")}
                    </Link>
                  ) : (
                    <StartSessionButton
                      groupId={o.groupId}
                      scheduledStart={o.scheduledStart.toISOString()}
                      label={t("startSession")}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ─── SECTION 2: Past Sessions (last 30 days) ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-muted-foreground" />
          {locale === "ar" ? "الحصص السابقة (آخر 30 يوماً)" : "Past Sessions (last 30 days)"}
        </h2>

        {pastSessions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm">
              {locale === "ar" ? "لا توجد حصص سابقة مسجلة." : "No past sessions recorded yet."}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pastSessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.group.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.scheduledStart.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    ·{" "}
                    {s.scheduledStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={statusVariant(s.status)} className="text-[10px]">
                    {s.status === "COMPLETED"
                      ? (locale === "ar" ? "مكتملة" : "Completed")
                      : s.status === "IN_PROGRESS"
                      ? tBadges("inProgress")
                      : s.status}
                  </Badge>
                  {reportBadge(s.dailyReport?.status)}
                  <Link
                    href={`/coach/sessions/${s.id}`}
                    className="inline-flex h-8 items-center rounded-md border border-csk-gold/60 px-3 text-xs font-semibold text-csk-gold hover:bg-csk-gold/10 transition-colors"
                  >
                    {locale === "ar" ? "عرض" : "View"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SECTION 3: All Available Groups (Ad-hoc start) ─── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2">
          {locale === "ar" ? "جميع الأفواج والفرق المتاحة" : "All Available Cohorts & Groups"}
        </h2>

        {allGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {locale === "ar" ? "لا توجد مجموعات مسندة إليك حالياً." : "No groups currently assigned to you."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allGroups.map((g) => {
              const todayOcc = occurrencesByGroupId.get(g.id);
              return (
                <Card key={g.id} className="flex flex-col justify-between hover:border-csk-gold/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base font-semibold line-clamp-1">{g.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0">{g.discipline.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{g.location.nameEn}</p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {todayOcc ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                          {locale === "ar" ? "لديه حصة مجدولة اليوم!" : "Scheduled for today!"}
                        </p>
                        {todayOcc.sessionId ? (
                          <Link
                            href={`/coach/sessions/${todayOcc.sessionId}`}
                            className="inline-flex w-full justify-center h-9 items-center rounded-md bg-csk-gold px-4 text-sm font-semibold text-csk-black hover:bg-csk-goldLight"
                          >
                            {t("openSession")}
                          </Link>
                        ) : (
                          <StartSessionButton
                            groupId={g.id}
                            scheduledStart={todayOcc.scheduledStart.toISOString()}
                            label={t("startSession")}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {locale === "ar" ? "لا توجد حصة مجدولة اليوم" : "No session scheduled today"}
                        </p>
                        <StartSessionButton
                          groupId={g.id}
                          scheduledStart={new Date().toISOString()}
                          label={locale === "ar" ? "بدء حصة غير مجدولة (Ad-hoc)" : "Start Ad-hoc Session"}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
