import { getTranslations } from "next-intl/server";
import { listGroups } from "@/application/groups/service";
import { requireRole } from "@/lib/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
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

export default async function CoachGroupsPage() {
  const user = await requireRole("COACH");
  const [t, groups] = await Promise.all([
    getTranslations("hcGroups"),
    listGroups({ coachId: user.id }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">List of training cohorts assigned to you.</p>
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((g) => {
            const schedule = (g.schedule as ScheduleJson | null) ?? {};
            return (
              <TableRow key={g.id}>
                <TableCell>
                  <Link
                    href={`/coach/groups/${g.id}`}
                    className="font-medium text-csk-gold hover:underline"
                  >
                    {g.name}
                  </Link>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {g.levelBands.map((lvl) => (
                      <Badge key={lvl} variant="outline">
                        {lvl}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{g.location.nameEn}</TableCell>
                <TableCell>
                  <Badge variant="outline">{g.discipline.category}</Badge>
                </TableCell>
                <TableCell>
                  {g.coaches.length > 0 ? (
                    g.coaches.map((c) => c.coach.fullNameEn).join(", ")
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {(schedule.days ?? []).join(", ")}
                  <br />
                  {schedule.startTime} – {schedule.endTime}
                </TableCell>
                <TableCell className="text-end">
                  {g._count.enrollments} / {g.capacity}
                </TableCell>
              </TableRow>
            );
          })}
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
