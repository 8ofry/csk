import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getDiscipline } from "@/application/disciplines/service";
import { requireRole } from "@/lib/auth-guard";
import { DisciplineForm } from "@/components/admin/discipline-form";
import { updateDisciplineAction } from "@/app/actions/disciplines";

export default async function EditDisciplinePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [t, d] = await Promise.all([
    getTranslations("adminDisciplines.detail"),
    getDiscipline(id),
  ]);
  if (!d) notFound();

  const update = updateDisciplineAction.bind(null, id);
  const skills = (d.skillsTaxonomy as { skills?: string[] } | null)?.skills ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{d.nameEn}</h1>
        <p className="text-muted-foreground">{d.nameAr}</p>
      </div>
      <DisciplineForm
        defaultValues={{
          nameAr: d.nameAr,
          nameEn: d.nameEn,
          category: d.category,
          skills,
          active: d.active,
        }}
        onSubmit={update}
        submitLabel={t("saveChanges")}
      />
    </div>
  );
}
