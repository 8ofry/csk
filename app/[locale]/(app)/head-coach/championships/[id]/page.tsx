import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getChampionship } from "@/application/championships/service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { VerifyPaymentButton } from "@/components/head-coach/verify-payment-button";
import { RunMatchmakingButton } from "@/components/head-coach/run-matchmaking-button";
import { RecordMatchResultRow } from "@/components/head-coach/record-match-result-row";
import { prisma } from "@/infrastructure/db/prisma";

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

  // Fetch pending payments
  const pendingPayments = ch.registrations.filter((r) => r.status === "PENDING_VERIFICATION");

  // Fetch match pairings
  const matches = await prisma.match.findMany({
    where: { championshipId: id },
    include: {
      fighter1: { include: { trainee: true } },
      fighter2: { include: { trainee: true } },
      winner: { include: { trainee: true } },
    },
    orderBy: { createdAt: "desc" },
  });

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

      {/* Pending Payments Verification Section */}
      {pendingPayments.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-yellow-600 dark:text-yellow-500 flex items-center gap-2">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending InstaPay Payments ({pendingPayments.length})
            </CardTitle>
            <CardDescription>
              Verify manual InstaPay bank transfers using the reference number and uploaded receipt screenshots.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fighter</TableHead>
                  <TableHead>InstaPay Reference</TableHead>
                  <TableHead>Receipt Screenshot</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-yellow-500/10">
                    <TableCell>
                      <div className="font-semibold">{p.trainee.fullNameEn}</div>
                      <div className="text-xs text-muted-foreground">{p.trainee.fullNameAr}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-sm text-yellow-600 dark:text-yellow-400">
                      {p.instapayRef}
                    </TableCell>
                    <TableCell>
                      {p.paymentReceiptUrl ? (
                        <a
                          href={p.paymentReceiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-csk-gold hover:underline"
                        >
                          View Receipt Link
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No image uploaded</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <VerifyPaymentButton registrationId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Roster list */}
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
                        r.status === "PAID"
                          ? "success"
                          : r.status === "COACH_CONFIRMED" || r.status === "PENDING_VERIFICATION"
                          ? "warning"
                          : "destructive"
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

      {/* Automated Matchmaking & Fixtures Section */}
      <Card className="border-csk-gold/20">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div>
            <CardTitle className="text-csk-gold">Tournament Match Card & Fixtures</CardTitle>
            <CardDescription>
              Matches are paired automatically based on gender, class division, and nearest weight (5kg threshold).
            </CardDescription>
          </div>
          <RunMatchmakingButton championshipId={id} />
        </CardHeader>
        <CardContent className="pt-6">
          <RecordMatchResultRow matches={matches} />
        </CardContent>
      </Card>

      {/* Single Fighter Manual Records Section */}
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
