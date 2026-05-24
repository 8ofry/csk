import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listAllSubscriptions } from "@/application/subscriptions/service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogPaymentInline } from "@/components/financial/log-payment-inline";

function statusBadge(status: string, labels: { paid: string; partial: string; due: string; overdue: string }) {
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

export default async function SubscriptionsPage() {
  await requireRole("HEAD_COACH");
  const [t, tBadges, subs] = await Promise.all([
    getTranslations("hcSubscriptions"),
    getTranslations("badges"),
    listAllSubscriptions(),
  ]);
  const badgeLabels = {
    paid: tBadges("paid"),
    partial: tBadges("partial"),
    due: tBadges("due"),
    overdue: tBadges("overdue"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/head-coach/subscriptions/new">{t("newButton")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("activeTitle", { count: subs.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.trainee")}</TableHead>
                <TableHead>{t("table.group")}</TableHead>
                <TableHead>{t("table.period")}</TableHead>
                <TableHead className="text-end">{t("table.fee")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.trainee.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">{s.trainee.fullNameAr}</div>
                  </TableCell>
                  <TableCell>
                    {s.group.name}{" "}
                    <span className="text-xs text-muted-foreground">@ {s.location.nameEn}</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {s.currentPeriodStart.toLocaleDateString()} —{" "}
                    {s.currentPeriodEnd.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-end">{Number(s.monthlyFee).toFixed(2)} EGP</TableCell>
                  <TableCell>
                    <div>{statusBadge(s.paymentStatus, badgeLabels)}</div>
                    {s.paymentStatus === "PAID" && (s as unknown as { payments?: { paidAt: Date }[] }).payments?.[0]?.paidAt && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {(s as unknown as { payments?: { paidAt: Date }[] }).payments?.[0]?.paidAt?.toLocaleDateString()}{" "}
                        {(s as unknown as { payments?: { paidAt: Date }[] }).payments?.[0]?.paidAt?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <LogPaymentInline
                      subscriptionId={s.id}
                      payerUserId={s.trainee.id}
                      defaultAmount={Number(s.monthlyFee)}
                      traineeName={s.trainee.fullNameEn}
                      traineePhone={s.trainee.phone}
                      groupName={s.group.name}
                      locationName={s.location.nameEn}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {subs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("empty")}
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
