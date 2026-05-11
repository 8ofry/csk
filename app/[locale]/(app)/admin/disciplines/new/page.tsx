import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { DisciplineForm } from "@/components/admin/discipline-form";
import { createDisciplineAction } from "@/app/actions/disciplines";

export default async function NewDisciplinePage() {
  await requireRole("ADMIN");
  const t = await getTranslations("adminDisciplines.newPage");
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <DisciplineForm onSubmit={createDisciplineAction} submitLabel={t("submit")} />
    </div>
  );
}
