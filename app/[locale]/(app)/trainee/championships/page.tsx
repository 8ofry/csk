import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import {
  careerRecordForTrainee,
  listOpenForTrainee,
} from "@/application/championships/service";
import { isTraineeCleared } from "@/application/medical/service";
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
import { OptInButton } from "@/components/trainee/opt-in-championship-button";

export default async function TraineeChampionshipsPage() {
  const user = await requireRole("TRAINEE");
  const [t, tCommon, tBadges, tFighters, open, mine, record, cleared] = await Promise.all([
    getTranslations("trainee.championships"),
    getTranslations("common"),
    getTranslations("badges"),
    getTranslations("publicSite.champions"),
    listOpenForTrainee(user.id),
    prisma.championshipRegistration.findMany({
      where: { traineeId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        championship: true,
        fightResults: true,
      },
    }),
    careerRecordForTrainee(user.id),
    isTraineeCleared(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("myRecord")}{" "}
            <span className="text-csk-gold">{record.display}</span>{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({tFighters("fights", { count: record.total })})
            </span>
          </CardTitle>
        </CardHeader>
        {record.methods.length > 0 && (
          <CardContent>
            <div className="flex flex-wrap gap-2 text-xs">
              {record.methods.map((m) => (
                <Badge key={m.method} variant="outline">
                  {m.method}: {m.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {!cleared && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{t("blockedNotice")}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("openHeader", { count: open.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableEvent")}</TableHead>
                <TableHead>{t("tableDates")}</TableHead>
                <TableHead>{t("tableDeadline")}</TableHead>
                <TableHead>{t("tableFee")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.locationLabel}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.startDate.toLocaleDateString()} – {e.endDate.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.registrationDeadline.toLocaleDateString()}
                  </TableCell>
                  <TableCell>{Number(e.registrationFee).toFixed(2)} EGP</TableCell>
                  <TableCell className="text-end">
                    <OptInButton championshipId={e.id} label={t("actionOptIn")} />
                  </TableCell>
                </TableRow>
              ))}
              {open.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t("noOpen")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("myRegsHeader", { count: mine.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableEvent")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead>{t("fightsCol")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.championship.name}</TableCell>
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
                      {tBadges(
                        r.status === "COACH_CONFIRMED"
                          ? "approved"
                          : r.status === "WITHDREW"
                            ? "withdrew"
                            : "pending",
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.fightResults.length === 0
                      ? "—"
                      : r.fightResults
                          .map((f) => `${f.outcome}${f.method ? ` (${f.method})` : ""}`)
                          .join(", ")}
                  </TableCell>
                </TableRow>
              ))}
              {mine.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    {t("noRegs")}
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
