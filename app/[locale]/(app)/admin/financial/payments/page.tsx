import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { listPayments } from "@/application/payments/service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PaymentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; revenueType?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;

  const [t, payments] = await Promise.all([
    getTranslations("adminPayments"),
    listPayments({
      from: sp.from ? new Date(sp.from) : undefined,
      to: sp.to ? new Date(sp.to) : undefined,
      revenueType: sp.revenueType,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.receipt")}</TableHead>
                <TableHead>{t("table.payer")}</TableHead>
                <TableHead>{t("table.stream")}</TableHead>
                <TableHead>{t("table.method")}</TableHead>
                <TableHead className="text-end">{t("table.gross")}</TableHead>
                <TableHead>{t("table.splits")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">
                    {p.paidAt.toLocaleDateString()}{" "}
                    <span className="text-muted-foreground">
                      {p.paidAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">{p.receiptNumber}</code>
                  </TableCell>
                  <TableCell>{p.payerUser.fullNameEn}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.revenueType}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.method}</TableCell>
                  <TableCell className="text-end">{Number(p.amountGross).toFixed(2)}</TableCell>
                  <TableCell className="text-xs">
                    {p.splits.map((s) => (
                      <div key={s.id}>
                        {s.recipientType}: {Number(s.amount).toFixed(2)} ({Number(s.percent).toFixed(1)}%)
                      </div>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
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
