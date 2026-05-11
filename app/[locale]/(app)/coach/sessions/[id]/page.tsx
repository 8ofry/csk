import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getSessionForCoach } from "@/application/sessions/service";
import { listTrainingUnits } from "@/application/training-units/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AttendanceRoster } from "@/components/coach/attendance-roster";
import { QuickEvalGrid } from "@/components/coach/quick-eval-grid";
import { EndSessionButton } from "@/components/coach/end-session-button";
import { ComposeReportButton } from "@/components/coach/compose-report-button";
import { getDailyReportBySessionId } from "@/application/daily-reports/service";
import type { AttendanceMark } from "@/application/attendance/service";

interface UnitItemRaw {
  trainingUnitId: string;
  durationOverrideSec?: number | null;
  roundsOverride?: number | null;
  notes?: string;
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("COACH");
  const { id } = await params;
  const session = await getSessionForCoach(id, user.id);
  if (!session) notFound();

  const [t, tBadges] = await Promise.all([
    getTranslations("session"),
    getTranslations("badges"),
  ]);

  const trainees = session.group.enrollments.map((e) => e.trainee);
  const attendanceMap = new Map(session.attendances.map((a) => [a.traineeId, a.status]));
  const evalMap = new Map(session.quickEvaluations.map((q) => [q.traineeId, q]));

  const planUnits = (session.plan?.unitsSequence as unknown as UnitItemRaw[] | undefined) ?? [];
  const unitDirectory =
    planUnits.length > 0
      ? await listTrainingUnits({})
      : [];
  const unitsById = new Map(unitDirectory.map((u) => [u.id, u]));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{session.group.name}</h1>
          <Badge
            variant={
              session.status === "IN_PROGRESS"
                ? "warning"
                : session.status === "COMPLETED"
                  ? "success"
                  : "secondary"
            }
          >
            {tBadges(
              session.status === "IN_PROGRESS"
                ? "inProgress"
                : session.status === "COMPLETED"
                  ? "completed"
                  : session.status === "CANCELLED"
                    ? "cancelled"
                    : "scheduled",
            )}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {session.group.location.nameEn} · {session.group.discipline.nameEn} ·{" "}
          {session.scheduledStart.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("attendanceTitle", { count: trainees.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceRoster
            sessionId={session.id}
            trainees={trainees.map((t) => ({
              id: t.id,
              fullNameEn: t.fullNameEn,
              fullNameAr: t.fullNameAr,
              current: attendanceMap.get(t.id) as AttendanceMark | undefined,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("quickEvalTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickEvalGrid
            sessionId={session.id}
            trainees={trainees.map((t) => {
              const e = evalMap.get(t.id);
              return {
                traineeId: t.id,
                fullNameEn: t.fullNameEn,
                fullNameAr: t.fullNameAr,
                current: e
                  ? {
                      effortScore: e.effortScore,
                      notes: e.notes,
                      flaggedBodyPart: e.flaggedBodyPart,
                      flaggedSkill: e.flaggedSkill,
                    }
                  : undefined,
              };
            })}
          />
        </CardContent>
      </Card>

      {planUnits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("approvedPlanTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {planUnits.map((it, idx) => {
                const u = unitsById.get(it.trainingUnitId);
                return (
                  <li key={idx} className="rounded-md border p-2">
                    <span className="font-medium">
                      {idx + 1}. {u?.nameEn ?? t("unitRemoved")}
                    </span>
                    <span className="ms-2 text-xs text-muted-foreground">
                      {it.durationOverrideSec ?? u?.recommendedDurationSeconds ?? "—"}s
                      {it.roundsOverride ? ` · ${t("rounds", { rounds: it.roundsOverride })}` : ""}
                    </span>
                    {it.notes && (
                      <div className="mt-1 text-xs text-muted-foreground">{it.notes}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {session.status === "IN_PROGRESS" && (
          <EndSessionButton sessionId={session.id} label={t("endSession")} />
        )}
        {await renderReportButton(session.id, {
          openLabel: (status: string) => t("openDailyReport", { status }),
          composeLabel: t("composeReport"),
        })}
        <Link
          href="/coach/today"
          className="inline-flex h-10 items-center rounded-md border border-csk-gold/40 px-4 text-sm text-csk-gold hover:bg-csk-gold/10"
        >
          {t("backToToday")}
        </Link>
      </div>
    </div>
  );
}

async function renderReportButton(
  sessionId: string,
  labels: { openLabel: (status: string) => string; composeLabel: string },
) {
  const existing = await getDailyReportBySessionId(sessionId);
  if (existing) {
    return (
      <Link
        href={`/coach/daily-reports/${existing.id}`}
        className="inline-flex h-10 items-center rounded-md bg-csk-gold px-4 text-sm font-semibold text-csk-black hover:bg-csk-goldLight"
      >
        {labels.openLabel(existing.status)}
      </Link>
    );
  }
  return <ComposeReportButton sessionId={sessionId} label={labels.composeLabel} />;
}
