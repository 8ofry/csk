import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import {
  attendanceTimeSeries,
  coachBenchmarks,
  cohortRetention,
  lifetimeValue,
  revenueTimeSeries,
} from "@/application/analytics/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/analytics/bar-chart";
import { CohortHeatmap } from "@/components/analytics/cohort-heatmap";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; from?: string; to?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  const monthsBack = Math.max(3, Math.min(24, Number(sp.months ?? 12)));
  const now = new Date();
  const ltvWindowFrom = sp.from
    ? new Date(sp.from)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const ltvWindowTo = sp.to ? new Date(sp.to) : now;

  const [t, tCommon, revenue, attendance, cohorts, ltv, benchmarks] = await Promise.all([
    getTranslations("adminAnalytics"),
    getTranslations("common"),
    revenueTimeSeries(monthsBack),
    attendanceTimeSeries(monthsBack),
    cohortRetention(monthsBack),
    lifetimeValue({ from: ltvWindowFrom, to: ltvWindowTo }),
    coachBenchmarks({ from: ltvWindowFrom, to: ltvWindowTo }),
  ]);

  const totalRevenue = revenue.total.reduce((s, b) => s + b.total, 0);
  const totalAttendance = attendance.reduce((s, b) => s + b.total, 0);
  const overallAttendanceRate =
    totalAttendance === 0
      ? 0
      : attendance.reduce((s, b) => s + b.attended, 0) / totalAttendance;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle", { months: monthsBack })}</p>
        </div>
        <form className="flex items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {t("monthsLabel")}
            </label>
            <input
              type="number"
              name="months"
              min={3}
              max={24}
              defaultValue={monthsBack}
              className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">
            {tCommon("apply")}
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label={t("kpi.netRevenue")} value={`${totalRevenue.toFixed(0)} EGP`} highlight />
        <KpiCard
          label={t("kpi.avgAttendance")}
          value={`${Math.round(overallAttendanceRate * 100)}%`}
          highlight
        />
        <KpiCard label={t("kpi.avgLtv")} value={`${ltv.globalAverageLtv.toFixed(0)} EGP`} />
        <KpiCard label={t("kpi.topCoach")} value={benchmarks[0]?.fullNameEn ?? "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("revenueTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={revenue.total.map((b) => ({ label: b.monthKey, value: b.total }))}
            format={(n) => `${Math.round(n)} EGP`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("attendanceTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={attendance.map((b) => ({ label: b.monthKey, value: Math.round(b.rate * 100) }))}
            format={(n) => `${n}%`}
            color="#65A30D"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cohortsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <CohortHeatmap report={cohorts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("ltvTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("perCohort")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ltvCohortTable.cohort")}</TableHead>
                  <TableHead className="text-end">{t("ltvCohortTable.trainees")}</TableHead>
                  <TableHead className="text-end">{t("ltvCohortTable.totalNet")}</TableHead>
                  <TableHead className="text-end">{t("ltvCohortTable.avgLtv")}</TableHead>
                  <TableHead className="text-end">{t("ltvCohortTable.avgLtvMonth")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ltv.perCohort.map((c) => (
                  <TableRow key={c.cohortKey}>
                    <TableCell>{c.cohortKey}</TableCell>
                    <TableCell className="text-end">{c.trainees}</TableCell>
                    <TableCell className="text-end">{c.totalNet.toFixed(2)}</TableCell>
                    <TableCell className="text-end">{c.averageLtv.toFixed(2)}</TableCell>
                    <TableCell className="text-end">{c.averageLtvPerMonth.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {ltv.perCohort.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {t("ltvEmpty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("perDiscipline")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ltvDiscTable.discipline")}</TableHead>
                  <TableHead className="text-end">{t("ltvDiscTable.trainees")}</TableHead>
                  <TableHead className="text-end">{t("ltvDiscTable.totalNet")}</TableHead>
                  <TableHead className="text-end">{t("ltvDiscTable.avgLtv")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ltv.perDiscipline.map((d) => (
                  <TableRow key={d.disciplineKey}>
                    <TableCell>{d.disciplineKey}</TableCell>
                    <TableCell className="text-end">{d.trainees}</TableCell>
                    <TableCell className="text-end">{d.totalNet.toFixed(2)}</TableCell>
                    <TableCell className="text-end">{d.averageLtv.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {ltv.perDiscipline.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t("ltvEmpty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("leaderboardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("leaderboardTable.coach")}</TableHead>
                <TableHead className="text-end">{t("leaderboardTable.score")}</TableHead>
                <TableHead className="text-end">{t("leaderboardTable.sessions")}</TableHead>
                <TableHead className="text-end">{t("leaderboardTable.trainees")}</TableHead>
                <TableHead className="text-end">{t("leaderboardTable.avgEffort")}</TableHead>
                <TableHead className="text-end">{t("leaderboardTable.reportsApproved")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benchmarks.map((c, i) => (
                <TableRow key={c.coachId}>
                  <TableCell>
                    {i === 0 && <span className="me-1 text-csk-gold">★</span>}
                    {c.fullNameEn}
                  </TableCell>
                  <TableCell className="text-end font-bold text-csk-gold">{c.score}</TableCell>
                  <TableCell className="text-end">{c.sessionsDelivered}</TableCell>
                  <TableCell className="text-end">{c.uniqueTrainees}</TableCell>
                  <TableCell className="text-end">
                    {c.averageEffortScore?.toFixed(1) ?? "—"}
                  </TableCell>
                  <TableCell className="text-end">
                    {c.reportsApprovedFirstTry}/{c.reportsTotal}
                  </TableCell>
                </TableRow>
              ))}
              {benchmarks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("leaderboardEmpty")}
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

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-csk-gold/40" : undefined}>
      <CardHeader>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${highlight ? "text-csk-gold" : "text-foreground"}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
