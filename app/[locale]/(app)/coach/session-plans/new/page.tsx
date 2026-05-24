import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { SessionPlanBuilder } from "@/components/coach/session-plan-builder";
import { createDraftPlanAction } from "@/app/actions/session-plans";
import { listTrainingUnits } from "@/application/training-units/service";
import { prisma } from "@/infrastructure/db/prisma";

export default async function NewPlanPage() {
  const user = await requireRole("COACH");

  const [t, groups, units] = await Promise.all([
    getTranslations("coachPlanNew"),
    prisma.group.findMany({
      where: { coaches: { some: { coachId: user.id } }, active: true },
      select: { id: true, name: true, location: { select: { nameEn: true } } },
    }),
    listTrainingUnits({ publishedOnly: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SessionPlanBuilder
        groups={groups.map((g) => ({ id: g.id, label: `${g.name} @ ${g.location.nameEn}` }))}
        units={units.map((u) => ({
          id: u.id,
          nameEn: u.nameEn,
          nameAr: u.nameAr,
          category: u.category,
          difficulty: u.difficulty,
          recommendedDurationSeconds: u.recommendedDurationSeconds,
          recommendedRounds: u.recommendedRounds,
        }))}
        onSubmit={createDraftPlanAction}
        submitLabel={t("submit")}
      />
    </div>
  );
}
