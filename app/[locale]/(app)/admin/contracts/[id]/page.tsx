import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getContract } from "@/application/contracts/service";
import { ContractForm } from "@/components/admin/contract-form";
import { updateContractAction } from "@/app/actions/contracts";
import { listLocations } from "@/application/locations/service";
import { listDisciplines } from "@/application/disciplines/service";
import { listActiveCoaches } from "@/application/users/directory";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [t, contract, coaches, locations, disciplines] = await Promise.all([
    getTranslations("adminContracts.detail"),
    getContract(id),
    listActiveCoaches(),
    listLocations(),
    listDisciplines(),
  ]);
  if (!contract) notFound();

  const update = updateContractAction.bind(null, id);
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{contract.coach.fullNameEn}</p>
      </div>
      <ContractForm
        coaches={coaches}
        locations={locations.map((l) => ({ id: l.id, label: l.nameEn }))}
        disciplines={disciplines.map((d) => ({ id: d.id, label: d.nameEn }))}
        defaultValues={{
          coachId: contract.coachId,
          locationId: contract.locationId,
          disciplineId: contract.disciplineId,
          subscriptionPercent: contract.subscriptionPercent
            ? Number(contract.subscriptionPercent)
            : null,
          privateSessionPercent: contract.privateSessionPercent
            ? Number(contract.privateSessionPercent)
            : null,
          privateSessionFixedRate: contract.privateSessionFixedRate
            ? Number(contract.privateSessionFixedRate)
            : null,
          beltExamPercent: contract.beltExamPercent ? Number(contract.beltExamPercent) : null,
          championshipPercent: contract.championshipPercent
            ? Number(contract.championshipPercent)
            : null,
          effectiveFrom: contract.effectiveFrom.toISOString().slice(0, 10),
          effectiveTo: contract.effectiveTo?.toISOString().slice(0, 10),
          notes: contract.notes,
        }}
        onSubmit={update}
        submitLabel={t("saveChanges")}
      />
    </div>
  );
}
