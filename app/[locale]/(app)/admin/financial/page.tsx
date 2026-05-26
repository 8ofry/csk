import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { Link } from "@/i18n/navigation";
import { ownerSnapshot } from "@/application/financial/dashboards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminFinancialPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireRole("HEAD_COACH");
  const sp = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const from = sp.from ? new Date(sp.from) : defaultFrom;
  const to = sp.to ? new Date(sp.to) : now;

  const [t, tCommon, snapshot] = await Promise.all([
    getTranslations("adminFinancial"),
    getTranslations("common"),
    ownerSnapshot({ from, to }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle", {
              from: from.toLocaleDateString(),
              to: to.toLocaleDateString(),
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: "/admin/financial/payments",
                query: { from: from.toISOString(), to: to.toISOString() },
              }}
            >
              {t("allPayments")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: "/admin/financial/expenses",
                query: { from: from.toISOString(), to: to.toISOString() },
              }}
            >
              {t("allExpenses")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href={`/api/v1/financial/export?from=${from.toISOString()}&to=${to.toISOString()}`}
              download
            >
              {t("exportCsv")}
            </a>
          </Button>
        </div>
      </div>

      {/* Period filter */}
      <form className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("from")}
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from.toISOString().slice(0, 10)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("to")}</label>
          <input
            type="date"
            name="to"
            defaultValue={to.toISOString().slice(0, 10)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="outline">
          {tCommon("apply")}
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label={t("kpi.totalRevenue")} value={snapshot.totalRevenue} highlight />
        <KpiCard label={t("kpi.cskShare")} value={snapshot.cskShare} highlight />
        <KpiCard label={t("kpi.totalExpenses")} value={snapshot.totalExpenses} />
        <KpiCard label={t("kpi.netProfit")} value={snapshot.netProfit} highlight />
        <KpiCard label={t("kpi.venuePayouts")} value={snapshot.venueShare} />
        <KpiCard label={t("kpi.coachPayouts")} value={snapshot.coachShare} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("byStreamTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.byStream.length === 0 ? (
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
                {snapshot.byStream.map((row) => (
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
          <CardTitle>{t("byLocationTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.byLocation.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("byLocationEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.location")}</TableHead>
                  <TableHead className="text-end">{t("table.gross")}</TableHead>
                  <TableHead className="text-end">{t("table.csk")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.byLocation.map((row) => (
                  <TableRow key={row.locationId}>
                    <TableCell>{row.locationName}</TableCell>
                    <TableCell className="text-end">{row.gross.toFixed(2)}</TableCell>
                    <TableCell className="text-end">{row.csk.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("outstandingTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-3xl font-bold text-csk-gold">
                {snapshot.outstandingReceivables.count}
              </span>{" "}
              <span className="text-muted-foreground">{t("outstandingSubsLabel")}</span>
            </div>
            <div>
              <span className="text-3xl font-bold text-csk-gold">
                {snapshot.outstandingReceivables.total.toFixed(2)}
              </span>{" "}
              <span className="text-muted-foreground">{t("outstandingFaceLabel")}</span>
            </div>
          </div>
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
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-csk-gold/40" : undefined}>
      <CardHeader>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${highlight ? "text-csk-gold" : "text-foreground"}`}>
          {value.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground">EGP</div>
      </CardContent>
    </Card>
  );
}
