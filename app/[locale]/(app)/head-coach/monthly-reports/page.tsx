import { getTranslations } from "next-intl/server";
import { listReportsForApproval } from "@/application/monthly-reports/service";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GenerateMonthlyButton } from "@/components/head-coach/generate-monthly-button";
import { ApproveMonthlyButton } from "@/components/head-coach/approve-monthly-button";

export default async function MonthlyReportsPage() {
  await requireRole("HEAD_COACH");

  const [t, tCommon, tBadges, drafts, trainees] = await Promise.all([
    getTranslations("monthlyReports"),
    getTranslations("common"),
    getTranslations("badges"),
    listReportsForApproval(),
    prisma.user.findMany({
      where: { role: "TRAINEE", status: "ACTIVE" },
      select: { id: true, fullNameEn: true, fullNameAr: true },
      orderBy: { fullNameEn: "asc" },
    }),
  ]);

  // Default period = previous month
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const defaultYear = prev.getFullYear();
  const defaultMonth = prev.getMonth() + 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("generateTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <GenerateMonthlyButton
            trainees={trainees.map((tr) => ({
              id: tr.id,
              label: `${tr.fullNameEn} (${tr.fullNameAr})`,
            }))}
            defaultYear={defaultYear}
            defaultMonth={defaultMonth}
            generateLabel={t("generateBtn")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("draftsTitle", { count: drafts.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.trainee")}</TableHead>
                <TableHead>{t("table.period")}</TableHead>
                <TableHead>{t("table.attendanceRate")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((r) => {
                const att = r.attendanceSummary as { rate?: number } | null;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.trainee.fullNameEn}</TableCell>
                    <TableCell>
                      {r.periodYear}-{String(r.periodMonth).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      {att?.rate != null ? `${Math.round(att.rate * 100)}%` : "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      <ApproveMonthlyButton reportId={r.id} label={t("approveDeliver")} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {drafts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    <Badge variant="success">{tBadges("empty")}</Badge> — {t("draftsEmpty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
