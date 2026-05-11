import { getTranslations } from "next-intl/server";
import { listTrainingUnits } from "@/application/training-units/service";
import { listDisciplines } from "@/application/disciplines/service";
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
import { TRAINING_UNIT_CATEGORIES } from "@/application/training-units/schemas";

export interface UnitBrowserProps {
  filters?: {
    disciplineId?: string;
    category?: string;
    difficulty?: number;
  };
  publishedOnly: boolean;
}

export async function UnitBrowser({ filters = {}, publishedOnly }: UnitBrowserProps) {
  const [t, tCommon, units, disciplines] = await Promise.all([
    getTranslations("unitBrowser"),
    getTranslations("common"),
    listTrainingUnits({
      disciplineId: filters.disciplineId,
      category: filters.category as (typeof TRAINING_UNIT_CATEGORIES)[number] | undefined,
      difficulty: filters.difficulty,
      publishedOnly,
    }),
    listDisciplines(),
  ]);

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("discipline")}
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
            {t("category")}
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
            {t("difficulty")}
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
            <TableHead>{t("table.bodyParts")}</TableHead>
            <TableHead>{t("table.media")}</TableHead>
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
              <TableCell className="text-xs text-muted-foreground">
                {t("partsCount", { count: u.targetBodyParts.length })}
              </TableCell>
              <TableCell>
                {u.demoMediaUrl ? (
                  <a
                    href={u.demoMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-csk-gold hover:underline"
                  >
                    {u.demoMediaType ?? t("viewLink")}
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
          {units.length === 0 && (
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
