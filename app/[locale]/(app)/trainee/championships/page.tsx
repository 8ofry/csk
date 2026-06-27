import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { getLocale } from "next-intl/server";
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
import { TogglePublicProfile } from "@/components/trainee/toggle-public-profile";

export default async function TraineeChampionshipsPage() {
  const user = await requireRole("TRAINEE");
  const locale = await getLocale();
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

  const isRtl = locale === "ar";

  // Fetch official match history in the system
  const traineeMatches = await prisma.match.findMany({
    where: {
      OR: [
        { fighter1: { traineeId: user.id } },
        { fighter2: { traineeId: user.id } },
      ],
    },
    include: {
      championship: true,
      fighter1: { include: { trainee: true } },
      fighter2: { include: { trainee: true } },
      winner: { include: { trainee: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Record and Stats */}
      <Card className="border-csk-gold/20">
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
                <Badge key={m.method} variant="outline" className="border-neutral-800">
                  {m.method}: {m.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {!cleared && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-sm text-destructive">{t("blockedNotice")}</p>
          </CardContent>
        </Card>
      )}

      {/* Open Registrations */}
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

      {/* My Registrations & Public Toggle */}
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
                <TableHead className="text-right">{isRtl ? "عرض للعامة" : "Public Showcase"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-semibold">{r.championship.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.level ? `${r.level} division` : ""} {r.weightKg ? `· ${r.weightKg} kg` : ""}
                    </div>
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
                  <TableCell className="text-right">
                    <TogglePublicProfile
                      registrationId={r.id}
                      initialIsPublic={r.isProfilePublic}
                      locale={locale}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {mine.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    {t("noRegs")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Official Match Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle>{isRtl ? "لوحة النزالات الرسمية" : "Official Match Scorecard"}</CardTitle>
        </CardHeader>
        <CardContent>
          {traineeMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {isRtl ? "لم يتم ترتيب أي نزالات في النظام بعد." : "No matches scheduled in the system yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRtl ? "البطولة" : "Event"}</TableHead>
                  <TableHead>{isRtl ? "الخصم" : "Opponent"}</TableHead>
                  <TableHead>{isRtl ? "النتيجة" : "Result"}</TableHead>
                  <TableHead>{isRtl ? "الطريقة" : "Details"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traineeMatches.map((m) => {
                  const isFighter1 = m.fighter1.traineeId === user.id;
                  const opponent = isFighter1 ? m.fighter2.trainee : m.fighter1.trainee;
                  const opponentName = isRtl ? opponent.fullNameAr : opponent.fullNameEn;
                  
                  let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";
                  if (m.winnerId !== null) {
                    outcome = m.winnerId === (isFighter1 ? m.fighter1Id : m.fighter2Id) ? "WIN" : "LOSS";
                  }

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-semibold">{m.championship.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{m.weightClass} · {m.fightClass}</div>
                      </TableCell>
                      <TableCell className="font-medium">{opponentName}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            outcome === "WIN"
                              ? "success"
                              : outcome === "LOSS"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {outcome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {m.winnerId ? (
                          <span className="font-semibold text-csk-gold">
                            {m.method || "Decision"} {m.round ? `(R${m.round})` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
