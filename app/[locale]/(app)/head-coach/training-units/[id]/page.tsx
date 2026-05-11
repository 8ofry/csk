import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getTrainingUnit } from "@/application/training-units/service";
import { listDisciplines } from "@/application/disciplines/service";
import { requireRole } from "@/lib/auth-guard";
import { TrainingUnitForm } from "@/components/head-coach/training-unit-form";
import { updateTrainingUnitAction } from "@/app/actions/training-units";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EditTrainingUnitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, tBadges, unit, disciplines] = await Promise.all([
    getTranslations("hcUnitDetail"),
    getTranslations("badges"),
    getTrainingUnit(id),
    listDisciplines(),
  ]);
  if (!unit) notFound();

  const update = updateTrainingUnitAction.bind(null, id);
  const disciplineIds = unit.disciplines.map((d) => d.disciplineId);

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{unit.nameEn}</h1>
        <p className="text-muted-foreground">
          {t("subtitle", { nameAr: unit.nameAr, version: unit.version })} ·{" "}
          {unit.published ? (
            <Badge variant="success">{tBadges("published")}</Badge>
          ) : (
            <Badge variant="warning">{tBadges("draft")}</Badge>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("editTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingUnitForm
            defaultValues={{
              nameAr: unit.nameAr,
              nameEn: unit.nameEn,
              descriptionAr: unit.descriptionAr,
              descriptionEn: unit.descriptionEn,
              category: unit.category,
              disciplineIds,
              targetBodyParts: unit.targetBodyParts,
              targetSkills: unit.targetSkills,
              difficulty: unit.difficulty,
              recommendedDurationSeconds: unit.recommendedDurationSeconds,
              recommendedRounds: unit.recommendedRounds,
              recommendedRoundDurationSec: unit.recommendedRoundDurationSec,
              equipmentRequired: unit.equipmentRequired,
              demoMediaUrl: unit.demoMediaUrl,
              demoMediaType: unit.demoMediaType as "gif" | "mp4" | null,
              published: unit.published,
            }}
            disciplines={disciplines.map((d) => ({ id: d.id, label: `${d.nameEn} — ${d.category}` }))}
            onSubmit={update}
            submitLabel={t("saveChanges")}
            showChangeNote
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("versionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {unit.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>{t("versionLabel", { version: v.version })}</span>
                <span className="text-muted-foreground">{v.changeNote ?? t("dash")}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
