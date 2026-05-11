import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyReportActions } from "@/components/head-coach/daily-report-actions";

export default async function HeadCoachDailyReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, tBadges, tActions, report] = await Promise.all([
    getTranslations("hcReviewReport"),
    getTranslations("badges"),
    getTranslations("hcApprovalActions"),
    prisma.dailyReport.findUnique({
      where: { id },
      include: {
        coach: { select: { fullNameEn: true, fullNameAr: true } },
        group: {
          select: {
            name: true,
            location: { select: { nameEn: true } },
            discipline: { select: { nameEn: true } },
          },
        },
        session: {
          include: {
            attendances: { include: { trainee: { select: { fullNameEn: true } } } },
            quickEvaluations: {
              include: { trainee: { select: { fullNameEn: true } } },
            },
          },
        },
      },
    }),
  ]);
  if (!report) notFound();

  const attendanceLabel = (status: string) => {
    switch (status) {
      case "PRESENT":
        return tBadges("present");
      case "ABSENT":
        return tBadges("absent");
      case "LATE":
        return tBadges("late");
      case "EXCUSED":
        return tBadges("excused");
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {report.group.name} · {report.group.location.nameEn} ·{" "}
          {report.session.scheduledStart.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("coachSummary")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="whitespace-pre-wrap text-sm">{report.summary ?? "—"}</p>
          {report.incidents && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">{t("incidents")}</div>
              <p className="whitespace-pre-wrap text-sm">{report.incidents}</p>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {t("submittedBy", {
              name: report.coach.fullNameEn,
              when: report.submittedAt?.toLocaleString() ?? "—",
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("attendanceTitle", { count: report.session.attendances.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
            {report.session.attendances.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>{a.trainee.fullNameEn}</span>
                <Badge
                  variant={
                    a.status === "PRESENT"
                      ? "success"
                      : a.status === "ABSENT"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {attendanceLabel(a.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("evaluationsTitle", { count: report.session.quickEvaluations.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {report.session.quickEvaluations.map((q) => (
              <li key={q.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <strong>{q.trainee.fullNameEn}</strong>
                  <Badge>{t("effortBadge", { score: q.effortScore })}</Badge>
                </div>
                {q.notes && <p className="mt-1 text-xs text-muted-foreground">{q.notes}</p>}
                {(q.flaggedBodyPart || q.flaggedSkill) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("flaggedPrefix", {
                      bodyPart: q.flaggedBodyPart ?? "",
                      skill: q.flaggedSkill ? t("flaggedSkillSuffix", { skill: q.flaggedSkill }) : "",
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DailyReportActions
        reportId={report.id}
        labels={{
          approveDeliver: tActions("approveDeliver"),
          reject: tActions("reject"),
          cancelReject: tActions("cancelReject"),
          confirmReject: tActions("confirmReject"),
          rejectPlaceholder: tActions("rejectReportPlaceholder"),
          shortCommentError: tActions("shortCommentError"),
        }}
      />
    </div>
  );
}
