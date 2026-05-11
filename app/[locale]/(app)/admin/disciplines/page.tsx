import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listDisciplines } from "@/application/disciplines/service";
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

export default async function DisciplinesPage() {
  await requireRole("ADMIN");
  const [t, tBadges, disciplines] = await Promise.all([
    getTranslations("adminDisciplines"),
    getTranslations("badges"),
    listDisciplines(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/disciplines/new">{t("newButton")}</Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.category")}</TableHead>
            <TableHead>{t("table.skills")}</TableHead>
            <TableHead className="text-end">{t("table.groups")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disciplines.map((d) => {
            const skills = (d.skillsTaxonomy as { skills?: string[] } | null)?.skills ?? [];
            const preview = skills.slice(0, 3).join(", ") + (skills.length > 3 ? "…" : "");
            return (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-medium">{d.nameEn}</div>
                  <div className="text-xs text-muted-foreground">{d.nameAr}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{d.category}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t("skillsSummary", { count: skills.length, preview })}
                </TableCell>
                <TableCell className="text-end">{d._count.groups}</TableCell>
                <TableCell>
                  {d.active ? (
                    <Badge variant="success">{tBadges("active")}</Badge>
                  ) : (
                    <Badge variant="secondary">{tBadges("archived")}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/disciplines/${d.id}`}>{t("table.edit")}</Link>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {disciplines.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                {t("empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
