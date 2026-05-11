import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listGroups } from "@/application/groups/service";
import { requireRole } from "@/lib/auth-guard";
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

interface ScheduleJson {
  days?: string[];
  startTime?: string;
  endTime?: string;
}

export default async function GroupsPage() {
  await requireRole("HEAD_COACH");
  const [t, groups] = await Promise.all([
    getTranslations("hcGroups"),
    listGroups(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/head-coach/groups/new">{t("newButton")}</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.group")}</TableHead>
            <TableHead>{t("table.location")}</TableHead>
            <TableHead>{t("table.discipline")}</TableHead>
            <TableHead>{t("table.coach")}</TableHead>
            <TableHead>{t("table.schedule")}</TableHead>
            <TableHead className="text-end">{t("table.enrolled")}</TableHead>
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g) => {
            const schedule = (g.schedule as ScheduleJson | null) ?? {};
            return (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="font-medium">{g.name}</div>
                  {g.levelBand && <Badge variant="outline">{g.levelBand}</Badge>}
                </TableCell>
                <TableCell>{g.location.nameEn}</TableCell>
                <TableCell>
                  <Badge variant="outline">{g.discipline.category}</Badge>
                </TableCell>
                <TableCell>
                  {g.primaryCoach ? g.primaryCoach.fullNameEn : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-xs">
                  {(schedule.days ?? []).join(", ")}
                  <br />
                  {schedule.startTime} – {schedule.endTime}
                </TableCell>
                <TableCell className="text-end">
                  {g._count.enrollments} / {g.capacity}
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/head-coach/groups/${g.id}`}>{t("table.manage")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
