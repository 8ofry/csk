import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyReportForm } from "@/components/coach/daily-report-form";

export default async function CoachDailyReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const user = await requireRole("COACH");
  const { reportId } = await params;
  const [t, tBadges, report] = await Promise.all([
    getTranslations("coachDailyReport"),
    getTranslations("badges"),
    prisma.dailyReport.findUnique({
      where: { id: reportId },
      include: {
        group: { select: { name: true, location: { select: { nameEn: true } } } },
        session: {
          include: {
            attendances: { include: { trainee: { select: { fullNameEn: true } } } },
            quickEvaluations: true,
          },
        },
      },
    }),
  ]);
  if (!report) notFound();
  if (report.coachId !== user.id) notFound();

  const counts = {
    PRESENT: 0,
    LATE: 0,
    ABSENT: 0,
    EXCUSED: 0,
  } as Record<string, number>;
  for (const a of report.session.attendances) counts[a.status] = (counts[a.status] ?? 0) + 1;
  const evalCount = report.session.quickEvaluations.length;

  const statusBadge = (() => {
    switch (report.status) {
      case "DRAFT":
        return tBadges("draft");
      case "PENDING":
        return tBadges("submitted");
      case "APPROVED":
        return tBadges("approved");
      case "REJECTED":
        return tBadges("rejected");
      default:
        return report.status;
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <Badge
            variant={
              report.status === "APPROVED"
                ? "success"
                : report.status === "REJECTED"
                  ? "destructive"
                  : "secondary"
            }
          >
            {statusBadge}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {report.group.name} · {report.group.location.nameEn} ·{" "}
          {report.session.scheduledStart.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("autoTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <li className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("auto.present")}</div>
              <div className="text-2xl font-bold text-csk-gold">{counts.PRESENT ?? 0}</div>
            </li>
            <li className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("auto.late")}</div>
              <div className="text-2xl font-bold text-csk-gold">{counts.LATE ?? 0}</div>
            </li>
            <li className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("auto.absent")}</div>
              <div className="text-2xl font-bold text-csk-gold">{counts.ABSENT ?? 0}</div>
            </li>
            <li className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("auto.quickEvals")}</div>
              <div className="text-2xl font-bold text-csk-gold">{evalCount}</div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("notesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DailyReportForm
            reportId={report.id}
            status={report.status}
            defaultValues={{ summary: report.summary ?? "", incidents: report.incidents ?? "" }}
            rejectionReason={report.rejectionReason}
          />
        </CardContent>
      </Card>
    </div>
  );
}
