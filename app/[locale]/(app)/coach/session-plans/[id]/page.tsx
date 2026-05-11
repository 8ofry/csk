import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getPlan } from "@/application/session-plans/service";
import { canEdit } from "@/domain/session-plans/state";
import { SessionPlanBuilder } from "@/components/coach/session-plan-builder";
import { PlanActions } from "@/components/coach/plan-actions";
import { updateDraftPlanAction } from "@/app/actions/session-plans";
import { listTrainingUnits } from "@/application/training-units/service";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnitItemRaw {
  trainingUnitId: string;
  durationOverrideSec?: number | null;
  roundsOverride?: number | null;
  notes?: string;
}

export default async function CoachPlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("COACH");
  const { id } = await params;
  const [t, tBadges, plan] = await Promise.all([
    getTranslations("coachPlanDetail"),
    getTranslations("badges"),
    getPlan(id),
  ]);
  if (!plan) notFound();
  if (plan.createdById !== user.id) notFound();

  const update = updateDraftPlanAction.bind(null, id);
  const [units, groups] = await Promise.all([
    listTrainingUnits({ publishedOnly: true }),
    prisma.group.findMany({
      where: { primaryCoachId: user.id, active: true },
      select: { id: true, name: true, location: { select: { nameEn: true } } },
    }),
  ]);

  const itemsRaw = (plan.unitsSequence as unknown as UnitItemRaw[]) ?? [];

  const planStatusLabel = (() => {
    switch (plan.status) {
      case "DRAFT":
        return tBadges("draft");
      case "PENDING":
        return tBadges("pending");
      case "APPROVED":
        return tBadges("approved");
      case "REJECTED":
        return tBadges("rejected");
      default:
        return plan.status;
    }
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {plan.isTemplate ? plan.templateName ?? t("untitledTemplate") : t("sessionPlan")}
        </h1>
        <p className="text-muted-foreground">
          {plan.group.name} · {plan.group.location.nameEn} · <Badge>{planStatusLabel}</Badge>
        </p>
      </div>

      {plan.status === "REJECTED" && plan.rejectionComment && (
        <Card>
          <CardHeader>
            <CardTitle>{t("feedbackTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{plan.rejectionComment}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("reviewedBy", {
                name: plan.reviewedBy?.fullNameEn ?? t("dash"),
                when: plan.reviewedAt?.toLocaleString() ?? t("dash"),
              })}
            </p>
          </CardContent>
        </Card>
      )}

      <PlanActions planId={plan.id} status={plan.status} />

      {canEdit(plan.status) ? (
        <SessionPlanBuilder
          defaultValues={{
            groupId: plan.groupId,
            sessionDate: plan.sessionDate.toISOString().slice(0, 16),
            units: itemsRaw,
            notes: plan.notes ?? "",
            isTemplate: plan.isTemplate,
            templateName: plan.templateName ?? "",
          }}
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
          onSubmit={update}
          submitLabel={t("saveChanges")}
        />
      ) : (
        <PlanReadView units={units} itemsRaw={itemsRaw} notes={plan.notes ?? ""} />
      )}
    </div>
  );
}

async function PlanReadView({
  units,
  itemsRaw,
  notes,
}: {
  units: { id: string; nameEn: string; recommendedDurationSeconds: number | null; recommendedRounds: number | null }[];
  itemsRaw: UnitItemRaw[];
  notes: string;
}) {
  const t = await getTranslations("coachPlanDetail");
  const map = new Map(units.map((u) => [u.id, u]));
  const fmtDuration = (item: UnitItemRaw, u: { recommendedDurationSeconds: number | null } | undefined) => {
    if (item.durationOverrideSec) return t("durationOverride", { seconds: item.durationOverrideSec });
    if (u?.recommendedDurationSeconds != null)
      return t("durationDefault", { seconds: u.recommendedDurationSeconds });
    return t("durationDefault", { seconds: t("dash") });
  };
  const fmtRounds = (item: UnitItemRaw, u: { recommendedRounds: number | null } | undefined) => {
    if (item.roundsOverride) return t("roundsLabel", { rounds: item.roundsOverride });
    if (u?.recommendedRounds != null) return t("roundsDefault", { rounds: u.recommendedRounds });
    return t("roundsDefault", { rounds: t("dash") });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("readSequenceTitle", { count: itemsRaw.length })}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2 text-sm">
          {itemsRaw.map((item, idx) => {
            const u = map.get(item.trainingUnitId);
            return (
              <li key={idx} className="rounded-md border p-3">
                <div className="font-medium">
                  {idx + 1}. {u?.nameEn ?? t("removedUnit")}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtDuration(item, u)} · {fmtRounds(item, u)}
                </div>
                {item.notes && <div className="mt-2 text-sm">{item.notes}</div>}
              </li>
            );
          })}
        </ol>
        {notes && (
          <div className="mt-4 rounded-md border bg-muted/30 p-3">
            <div className="text-xs font-medium text-muted-foreground">{t("planNotes")}</div>
            <p className="mt-1 text-sm">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
