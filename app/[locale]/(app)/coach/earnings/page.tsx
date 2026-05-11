import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { coachEarnings } from "@/application/financial/dashboards";
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

export default async function CoachEarningsPage() {
  const user = await requireRole("COACH");

  const now = new Date();
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  const ytdStart = new Date(now.getFullYear(), 0, 1);

  const [t, tCommon, mtd, lastMonth, ytd] = await Promise.all([
    getTranslations("coachEarnings"),
    getTranslations("common"),
    coachEarnings(user.id, { from: mtdStart, to: now }),
    coachEarnings(user.id, { from: lastMonthStart, to: lastMonthEnd }),
    coachEarnings(user.id, { from: ytdStart, to: now }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={t("kpi.mtd")} value={mtd.total} />
        <KpiCard label={t("kpi.lastMonth")} value={lastMonth.total} />
        <KpiCard label={t("kpi.ytd")} value={ytd.total} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("byStreamTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {mtd.byStream.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("byStreamEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.stream")}</TableHead>
                  <TableHead className="text-end">{t("table.count")}</TableHead>
                  <TableHead className="text-end">{t("table.net")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mtd.byStream.map((row) => (
                  <TableRow key={row.revenueType}>
                    <TableCell>
                      <Badge variant="outline">{row.revenueType}</Badge>
                    </TableCell>
                    <TableCell className="text-end">{row.count}</TableCell>
                    <TableCell className="text-end">{row.net.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("txTitle", { count: mtd.transactions.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {mtd.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("txEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tCommon("date")}</TableHead>
                  <TableHead>{t("table.stream")}</TableHead>
                  <TableHead className="text-end">{t("table.myPercent")}</TableHead>
                  <TableHead className="text-end">{t("table.myShare")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mtd.transactions.slice(0, 50).map((tx) => (
                  <TableRow key={tx.paymentId}>
                    <TableCell>{tx.paidAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.revenueType}</Badge>
                    </TableCell>
                    <TableCell className="text-end">{tx.percent.toFixed(2)}%</TableCell>
                    <TableCell className="text-end">{tx.amount.toFixed(2)} EGP</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-csk-gold">{value.toFixed(2)} EGP</div>
      </CardContent>
    </Card>
  );
}
