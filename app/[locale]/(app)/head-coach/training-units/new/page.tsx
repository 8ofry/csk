import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { TrainingUnitForm } from "@/components/head-coach/training-unit-form";
import { createTrainingUnitAction } from "@/app/actions/training-units";
import { listDisciplines } from "@/application/disciplines/service";

export default async function NewTrainingUnitPage() {
  await requireRole("HEAD_COACH");
  const [t, disciplines] = await Promise.all([
    getTranslations("hcUnitDetail.newPage"),
    listDisciplines(),
  ]);
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <TrainingUnitForm
        disciplines={disciplines.map((d) => ({ id: d.id, label: `${d.nameEn} — ${d.category}` }))}
        onSubmit={createTrainingUnitAction}
        submitLabel={t("submit")}
      />
    </div>
  );
}
