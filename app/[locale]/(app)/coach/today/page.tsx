import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listScheduledForCoach } from "@/application/sessions/service";
import { listGroups } from "@/application/groups/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartSessionButton } from "@/components/coach/start-session-button";

export default async function CoachTodayPage() {
  const user = await requireRole("COACH");
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const [t, tBadges, locale, occurrences, allGroups] = await Promise.all([
    getTranslations("coachToday"),
    getTranslations("badges"),
    getLocale(),
    listScheduledForCoach(user.id, start, end),
    listGroups({ coachId: user.id }),
  ]);

  const dateLabel = today.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Map today's occurrences by groupId for quick lookup
  const occurrencesByGroupId = new Map(occurrences.map((o) => [o.groupId, o]));

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{dateLabel}</p>
      </div>

      {/* SECTION 1: Today's Scheduled Sessions */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-csk-gold animate-pulse" />
          {locale === "ar" ? "حصص اليوم المجدولة" : "Today's Scheduled Sessions"}
        </h2>

        {occurrences.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("noSessions")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {occurrences.map((o) => (
              <Card key={`${o.groupId}-${o.scheduledStart.toISOString()}`} className="border-l-4 border-l-csk-gold">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{o.groupName}</span>
                    {o.status === "IN_PROGRESS" && (
                      <Badge variant="warning">{tBadges("inProgress")}</Badge>
                    )}
                    {o.status === "COMPLETED" && (
                      <Badge variant="success">{tBadges("completed")}</Badge>
                    )}
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

      {/* SECTION 2: All Available Groups */}
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
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {g.location.nameEn}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {todayOcc ? (
                      // Today session is scheduled/materialized
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
                      // No session scheduled for today -> Ad-hoc allowed
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
