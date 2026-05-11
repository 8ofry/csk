import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { UnitBrowser } from "@/components/training-units/unit-browser";

export default async function InternTrainingUnitsPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplineId?: string; category?: string; difficulty?: string }>;
}) {
  await requireRole("INTERN");
  const [t, sp] = await Promise.all([getTranslations("internUnits"), searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <UnitBrowser
        publishedOnly
        filters={{
          disciplineId: sp.disciplineId,
          category: sp.category,
          difficulty: sp.difficulty ? Number(sp.difficulty) : undefined,
        }}
      />
    </div>
  );
}
