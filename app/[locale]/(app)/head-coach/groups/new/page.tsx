import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { GroupForm } from "@/components/head-coach/group-form";
import { createGroupAction } from "@/app/actions/groups";
import { listLocations } from "@/application/locations/service";
import { listDisciplines } from "@/application/disciplines/service";
import { listActiveCoaches, listActiveInterns } from "@/application/users/directory";

export default async function NewGroupPage() {
  await requireRole("HEAD_COACH");
  const [t, locations, disciplines, coaches, interns] = await Promise.all([
    getTranslations("hcGroups.newPage"),
    listLocations(),
    listDisciplines(),
    listActiveCoaches(),
    listActiveInterns(),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <GroupForm
        locations={locations.map((l) => ({ id: l.id, label: `${l.nameEn} (${l.district})` }))}
        disciplines={disciplines.map((d) => ({ id: d.id, label: `${d.nameEn} — ${d.category}` }))}
        coaches={coaches}
        interns={interns}
        onSubmit={createGroupAction}
        submitLabel={t("submit")}
      />
    </div>
  );
}
