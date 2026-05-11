import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTrainingUnits } from "@/application/training-units/service";
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
import { TRAINING_UNIT_CATEGORIES } from "@/application/training-units/schemas";

export default async function HeadCoachTrainingUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplineId?: string; category?: string; difficulty?: string }>;
}) {
  await requireRole("HEAD_COACH");
  const sp = await searchParams;
  const filters = {
    disciplineId: sp.disciplineId,
    category: sp.category as (typeof TRAINING_UNIT_CATEGORIES)[number] | undefined,
    difficulty: sp.difficulty ? Number(sp.difficulty) : undefined,
  };

  const [t, tCommon, tBadges, units, disciplines] = await Promise.all([
    getTranslations("hcTrainingUnits"),
    getTranslations("common"),
    getTranslations("badges"),
    listTrainingUnits(filters),
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
          <Link href="/head-coach/training-units/new">{t("newButton")}</Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("filters.discipline")}
          </label>
          <select
            name="disciplineId"
            defaultValue={filters.disciplineId ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{tCommon("all")}</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("filters.category")}
          </label>
          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{tCommon("all")}</option>
            {TRAINING_UNIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("filters.difficulty")}
          </label>
          <select
            name="difficulty"
            defaultValue={filters.difficulty?.toString() ?? ""}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">{tCommon("all")}</option>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="outline">
          {tCommon("apply")}
        </Button>
      </form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("table.name")}</TableHead>
            <TableHead>{t("table.category")}</TableHead>
            <TableHead>{t("table.difficulty")}</TableHead>
            <TableHead>{t("table.disciplines")}</TableHead>
            <TableHead>{t("table.media")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-end">{t("table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="font-medium">{u.nameEn}</div>
                <div className="text-xs text-muted-foreground">{u.nameAr}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{u.category}</Badge>
              </TableCell>
              <TableCell>{"★".repeat(u.difficulty)}</TableCell>
              <TableCell className="text-xs">
                {u.disciplines.map((d) => d.discipline.nameEn).join(", ")}
              </TableCell>
              <TableCell>
                {u.demoMediaUrl ? (
                  <Badge variant="secondary">{u.demoMediaType ?? "media"}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {u.published ? (
                  <Badge variant="success">{tBadges("published")}</Badge>
                ) : (
                  <Badge variant="warning">{tBadges("draft")}</Badge>
                )}
              </TableCell>
              <TableCell className="text-end">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/head-coach/training-units/${u.id}`}>{t("table.edit")}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {units.length === 0 && (
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
