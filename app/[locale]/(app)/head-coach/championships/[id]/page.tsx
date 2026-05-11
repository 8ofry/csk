import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getChampionship } from "@/application/championships/service";
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
import { ConfirmRegistrationButton } from "@/components/head-coach/confirm-registration-button";
import { RecordFightResultRow } from "@/components/head-coach/record-fight-result-row";

export default async function ChampionshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, ch] = await Promise.all([
    getTranslations("hcChampDetail"),
    getChampionship(id),
  ]);
  if (!ch) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{ch.name}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", {
            location: ch.locationLabel,
            start: ch.startDate.toLocaleDateString(),
            end: ch.endDate.toLocaleDateString(),
            fee: Number(ch.registrationFee).toFixed(2),
          })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("registrationsTitle", { count: ch.registrations.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.trainee")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.weight")}</TableHead>
                <TableHead>{t("table.level")}</TableHead>
                <TableHead>{t("table.fights")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ch.registrations.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">{r.trainee.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">{r.trainee.fullNameAr}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "COACH_CONFIRMED" || r.status === "PAID"
                          ? "success"
                          : r.status === "WITHDREW"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{r.weightKg ? t("kg", { kg: r.weightKg.toString() }) : t("dash")}</TableCell>
                  <TableCell>{r.level ?? t("dash")}</TableCell>
                  <TableCell>{r.fightResults.length}</TableCell>
                  <TableCell className="text-end space-x-2">
                    {r.status === "OPTED_IN" && (
                      <ConfirmRegistrationButton registrationId={r.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {ch.registrations.length === 0 && (
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

      <Card>
        <CardHeader>
          <CardTitle>{t("recordFightTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <RecordFightResultRow
            registrations={ch.registrations
              .filter((r) => r.status === "COACH_CONFIRMED" || r.status === "PAID")
              .map((r) => ({
                id: r.id,
                label: `${r.trainee.fullNameEn}`,
              }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
