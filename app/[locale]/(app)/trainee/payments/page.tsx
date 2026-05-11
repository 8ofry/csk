import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listSubscriptionsForTrainee } from "@/application/subscriptions/service";
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
import { PayOnlineButton } from "@/components/trainee/pay-online-button";
import { featureFlags } from "@/lib/feature-flags";

function statusBadge(status: string, labels: Record<string, string>) {
  switch (status) {
    case "PAID":
      return <Badge variant="success">{labels.paid}</Badge>;
    case "PARTIAL":
      return <Badge variant="warning">{labels.partial}</Badge>;
    case "DUE":
      return <Badge variant="outline">{labels.due}</Badge>;
    case "OVERDUE":
      return <Badge variant="destructive">{labels.overdue}</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default async function TraineePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ intent_returned?: string }>;
}) {
  const user = await requireRole("TRAINEE");
  const sp = await searchParams;
  const onlineOn = featureFlags.onlinePayments();

  const [t, tCommon, tTable, subs, payments] = await Promise.all([
    getTranslations("trainee.payments"),
    getTranslations("common"),
    getTranslations("trainee.paymentsTable"),
    listSubscriptionsForTrainee(user.id),
    prisma.payment.findMany({
      where: { payerUserId: user.id },
      orderBy: { paidAt: "desc" },
      take: 25,
    }),
  ]);

  const statusLabels = {
    paid: tCommon("paid"),
    partial: tCommon("partial"),
    due: tCommon("due"),
    overdue: tCommon("overdue"),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {sp.intent_returned && (
        <Card className="border-csk-gold/40 bg-csk-gold/5">
          <CardContent className="py-4 text-sm">{t("intentBanner")}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {t("subscriptionsHeader")} ({subs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tTable("group")}</TableHead>
                <TableHead>{tTable("period")}</TableHead>
                <TableHead className="text-end">{tTable("fee")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-end">{tTable("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.group.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {s.location.nameEn} · {s.discipline.nameEn}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.currentPeriodStart.toLocaleDateString()} —{" "}
                    {s.currentPeriodEnd.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">{Number(s.monthlyFee).toFixed(2)}</TableCell>
                  <TableCell>{statusBadge(s.paymentStatus, statusLabels)}</TableCell>
                  <TableCell className="text-end">
                    {s.paymentStatus !== "PAID" && onlineOn ? (
                      <PayOnlineButton subscriptionId={s.id} />
                    ) : s.paymentStatus !== "PAID" ? (
                      <span className="text-xs text-muted-foreground">
                        {t("payInPersonHint")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {subs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noSubs")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("historyHeader")} ({payments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("date")}</TableHead>
                <TableHead>{tTable("type")}</TableHead>
                <TableHead>{tTable("receipt")}</TableHead>
                <TableHead>{tCommon("method")}</TableHead>
                <TableHead className="text-end">{tTable("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{p.paidAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.revenueType}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">{p.receiptNumber}</code>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.method}</TableCell>
                  <TableCell className="text-end">{Number(p.amountGross).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noPayments")}
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
