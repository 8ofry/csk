import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { listContracts } from "@/application/contracts/service";
import { Card, CardContent } from "@/components/ui/card";
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

export default async function ContractsPage() {
  await requireRole("ADMIN");
  const [t, contracts] = await Promise.all([
    getTranslations("adminContracts"),
    listContracts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/contracts/new">{t("newButton")}</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.coach")}</TableHead>
                <TableHead>{t("table.scope")}</TableHead>
                <TableHead className="text-end">{t("table.sub")}</TableHead>
                <TableHead className="text-end">{t("table.private")}</TableHead>
                <TableHead className="text-end">{t("table.privateFixed")}</TableHead>
                <TableHead className="text-end">{t("table.belt")}</TableHead>
                <TableHead className="text-end">{t("table.champ")}</TableHead>
                <TableHead>{t("table.effective")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.coach.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">{c.coach.fullNameAr}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {c.location ? c.location.nameEn : <Badge variant="outline">{t("allLocations")}</Badge>}{" "}
                    {c.discipline ? `· ${c.discipline.nameEn}` : ""}
                  </TableCell>
                  <TableCell className="text-end">{fmt(c.subscriptionPercent)}</TableCell>
                  <TableCell className="text-end">{fmt(c.privateSessionPercent)}</TableCell>
                  <TableCell className="text-end">{fmtMoney(c.privateSessionFixedRate)}</TableCell>
                  <TableCell className="text-end">{fmt(c.beltExamPercent)}</TableCell>
                  <TableCell className="text-end">{fmt(c.championshipPercent)}</TableCell>
                  <TableCell className="text-xs">
                    {c.effectiveFrom.toLocaleDateString()}
                    {c.effectiveTo ? ` – ${c.effectiveTo.toLocaleDateString()}` : ""}
                  </TableCell>
                  <TableCell className="text-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/contracts/${c.id}`}>{t("table.edit")}</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
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

function fmt(d: { toString: () => string } | null) {
  return d == null ? "—" : `${Number(d.toString()).toFixed(2)}%`;
}

function fmtMoney(d: { toString: () => string } | null) {
  return d == null ? "—" : `${Number(d.toString()).toFixed(2)} EGP`;
}
