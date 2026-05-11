import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import {
  bestCoachShortlistForLocation,
  bestTraineeShortlistForGroup,
  listAllCertificates,
} from "@/application/certificates/service";
import { listGroups } from "@/application/groups/service";
import { listLocations } from "@/application/locations/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IssueCertificateButton } from "@/components/head-coach/issue-certificate-button";

export default async function HeadCoachCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    groupId?: string;
    locationId?: string;
  }>;
}) {
  await requireRole("HEAD_COACH");
  const sp = await searchParams;

  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = sp.year ? Number(sp.year) : prev.getFullYear();
  const month = sp.month ? Number(sp.month) : prev.getMonth() + 1;
  const period = `${year}-${String(month).padStart(2, "0")}`;

  const [t, tCommon, groups, locations, issued] = await Promise.all([
    getTranslations("hcCertificates"),
    getTranslations("common"),
    listGroups({ active: true }),
    listLocations(),
    listAllCertificates(year, month),
  ]);

  const groupId = sp.groupId ?? groups[0]?.id;
  const locationId = sp.locationId ?? locations[0]?.id;

  const [traineeShortlist, coachShortlist] = await Promise.all([
    groupId ? bestTraineeShortlistForGroup(groupId, year, month) : Promise.resolve([]),
    locationId
      ? bestCoachShortlistForLocation(locationId, year, month)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("year")}
          </label>
          <input
            type="number"
            name="year"
            min={2024}
            max={2099}
            defaultValue={year}
            className="h-9 w-24 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("month")}
          </label>
          <input
            type="number"
            name="month"
            min={1}
            max={12}
            defaultValue={month}
            className="h-9 w-20 rounded-md border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("groupForBestTrainee")}
          </label>
          <select
            name="groupId"
            defaultValue={groupId}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("locationForBestCoach")}
          </label>
          <select
            name="locationId"
            defaultValue={locationId}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nameEn}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="outline">
          {tCommon("apply")}
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t("bestTraineeTitle", { period })}</CardTitle>
        </CardHeader>
        <CardContent>
          {traineeShortlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noTraineeData")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.trainee")}</TableHead>
                  <TableHead className="text-end">{t("table.score")}</TableHead>
                  <TableHead className="text-end">{t("table.attendance")}</TableHead>
                  <TableHead className="text-end">{t("table.avgEffort")}</TableHead>
                  <TableHead className="text-end">{t("table.sessions")}</TableHead>
                  <TableHead className="text-end">{t("table.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {traineeShortlist.map((trainee, idx) => (
                  <TableRow key={trainee.traineeId}>
                    <TableCell>
                      <div className="font-medium">
                        {idx === 0 && <span className="me-1 text-csk-gold">★</span>}
                        {trainee.fullNameEn}
                      </div>
                      <div className="text-xs text-muted-foreground">{trainee.fullNameAr}</div>
                    </TableCell>
                    <TableCell className="text-end font-bold text-csk-gold">
                      {trainee.score}
                    </TableCell>
                    <TableCell className="text-end">
                      {Math.round(trainee.attendanceRate * 100)}%
                    </TableCell>
                    <TableCell className="text-end">
                      {trainee.averageEffort?.toFixed(1) ?? "—"}
                    </TableCell>
                    <TableCell className="text-end">{trainee.sessionsCompleted}</TableCell>
                    <TableCell className="text-end">
                      <IssueCertificateButton
                        recipientId={trainee.traineeId}
                        awardType="BEST_TRAINEE_GROUP"
                        groupId={groupId ?? null}
                        year={year}
                        month={month}
                        suggestedNarrative={`${Math.round(trainee.attendanceRate * 100)}% attendance with avg effort ${trainee.averageEffort?.toFixed(1) ?? "—"}/10 across ${trainee.sessionsCompleted} sessions.`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("bestCoachTitle", { period })}</CardTitle>
        </CardHeader>
        <CardContent>
          {coachShortlist.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noCoachData")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.coach")}</TableHead>
                  <TableHead className="text-end">{t("table.score")}</TableHead>
                  <TableHead className="text-end">{t("table.sessions")}</TableHead>
                  <TableHead className="text-end">{t("table.avgEffort")}</TableHead>
                  <TableHead className="text-end">{t("table.reportsApproved")}</TableHead>
                  <TableHead className="text-end">{t("table.action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coachShortlist.map((c, idx) => (
                  <TableRow key={c.coachId}>
                    <TableCell>
                      <div className="font-medium">
                        {idx === 0 && <span className="me-1 text-csk-gold">★</span>}
                        {c.fullNameEn}
                      </div>
                      <div className="text-xs text-muted-foreground">{c.fullNameAr}</div>
                    </TableCell>
                    <TableCell className="text-end font-bold text-csk-gold">{c.score}</TableCell>
                    <TableCell className="text-end">{c.sessionsRun}</TableCell>
                    <TableCell className="text-end">
                      {c.averageGroupEffort?.toFixed(1) ?? "—"}
                    </TableCell>
                    <TableCell className="text-end">
                      {c.reportsApprovedFirstTry}/{c.reportsTotal}
                    </TableCell>
                    <TableCell className="text-end">
                      <IssueCertificateButton
                        recipientId={c.coachId}
                        awardType="BEST_COACH_LOCATION"
                        groupId={null}
                        year={year}
                        month={month}
                        suggestedNarrative={`${c.sessionsRun} sessions delivered with avg effort ${c.averageGroupEffort?.toFixed(1) ?? "—"}/10 and ${c.reportsApprovedFirstTry}/${c.reportsTotal} reports approved.`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("issuedTitle", { count: issued.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {issued.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("issuedEmpty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.recipient")}</TableHead>
                  <TableHead>{t("table.award")}</TableHead>
                  <TableHead>{t("table.narrative")}</TableHead>
                  <TableHead>{t("table.issuedBy")}</TableHead>
                  <TableHead>{t("table.date")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issued.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.recipient.fullNameEn}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.awardType}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.narrative}</TableCell>
                    <TableCell>{c.issuedBy.fullNameEn}</TableCell>
                    <TableCell className="text-xs">{c.issuedAt.toLocaleDateString()}</TableCell>
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
