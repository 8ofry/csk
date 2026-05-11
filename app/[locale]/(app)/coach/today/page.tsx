import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listScheduledForCoach } from "@/application/sessions/service";
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

  const [t, tBadges, locale, occurrences] = await Promise.all([
    getTranslations("coachToday"),
    getTranslations("badges"),
    getLocale(),
    listScheduledForCoach(user.id, start, end),
  ]);
  const dateLabel = today.toLocaleDateString(locale === "ar" ? "ar-EG" : undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{dateLabel}</p>
      </div>

      {occurrences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("noSessions")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {occurrences.map((o) => (
            <Card key={`${o.groupId}-${o.scheduledStart.toISOString()}`}>
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
                    className="inline-flex h-11 items-center rounded-md bg-csk-gold px-6 text-base font-semibold text-csk-black hover:bg-csk-goldLight"
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
    </div>
  );
}
