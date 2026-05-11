import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { ContractForm } from "@/components/admin/contract-form";
import { createContractAction } from "@/app/actions/contracts";
import { listLocations } from "@/application/locations/service";
import { listDisciplines } from "@/application/disciplines/service";
import { listActiveCoaches } from "@/application/users/directory";

export default async function NewContractPage() {
  await requireRole("ADMIN");
  const [t, coaches, locations, disciplines] = await Promise.all([
    getTranslations("adminContracts.newPage"),
    listActiveCoaches(),
    listLocations(),
    listDisciplines(),
  ]);
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <ContractForm
        coaches={coaches}
        locations={locations.map((l) => ({ id: l.id, label: l.nameEn }))}
        disciplines={disciplines.map((d) => ({ id: d.id, label: d.nameEn }))}
        onSubmit={createContractAction}
        submitLabel={t("submit")}
      />
    </div>
  );
}
