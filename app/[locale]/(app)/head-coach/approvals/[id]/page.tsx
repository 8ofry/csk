import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { getPlan } from "@/application/session-plans/service";
import { listTrainingUnits } from "@/application/training-units/service";
import { ReviewPlanPanel } from "@/components/head-coach/review-plan-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UnitItemRaw {
  trainingUnitId: string;
  durationOverrideSec?: number | null;
  roundsOverride?: number | null;
  notes?: string;
}

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;
  const [t, tActions, plan] = await Promise.all([
    getTranslations("hcReviewPlan"),
    getTranslations("hcApprovalActions"),
    getPlan(id),
  ]);
  if (!plan) notFound();

  const unitDirectory = await listTrainingUnits({});
  const unitsById = new Map(unitDirectory.map((u) => [u.id, u]));
  const itemsRaw = (plan.unitsSequence as unknown as UnitItemRaw[]) ?? [];

  const availableUnits = unitDirectory.map((u) => ({
    id: u.id,
    nameEn: u.nameEn,
    nameAr: u.nameAr,
    category: u.category,
    difficulty: u.difficulty,
    recommendedDurationSeconds: u.recommendedDurationSeconds,
    recommendedRounds: u.recommendedRounds,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {plan.group.name} · {plan.group.location.nameEn} · {plan.sessionDate.toLocaleString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("coachCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {plan.createdBy.fullNameEn}{" "}
            <span className="text-muted-foreground">({plan.createdBy.fullNameAr})</span>
          </p>
        </CardContent>
      </Card>

      {plan.status === "PENDING" ? (
        <ReviewPlanPanel
          planId={plan.id}
          defaultValues={{
            units: itemsRaw,
            notes: plan.notes ?? "",
          }}
          units={availableUnits}
          labels={{
            approve: tActions("approve"),
            reject: tActions("reject"),
            rejectPlaceholder: tActions("rejectPlaceholder"),
            shortCommentError: tActions("shortCommentRejectError"),
          }}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("sequenceTitle", { count: itemsRaw.length })}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {itemsRaw.map((item, idx) => {
                  const u = unitsById.get(item.trainingUnitId);
                  const durationText = item.durationOverrideSec
                    ? t("durationOverride", { seconds: item.durationOverrideSec })
                    : u?.recommendedDurationSeconds != null
                      ? t("durationDefault", { seconds: u.recommendedDurationSeconds })
                      : t("dash");
                  const roundsText = item.roundsOverride
                    ? t("roundsOverride", { rounds: item.roundsOverride })
                    : u?.recommendedRounds != null
                      ? t("roundsDefault", { rounds: u.recommendedRounds })
                      : t("dash");
                  return (
                    <li key={idx} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {idx + 1}. {u?.nameEn ?? t("unknownUnit")}
                        </div>
                        {u && <Badge variant="outline">{u.category}</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {durationText} · {roundsText}
                      </div>
                      {item.notes && <div className="mt-2 text-sm">{item.notes}</div>}
                    </li>
                  );
                })}
              </ol>
              {plan.notes && (
                <div className="mt-4 rounded-md border bg-muted/30 p-3">
                  <div className="text-xs font-medium text-muted-foreground">{t("planNotes")}</div>
                  <p className="mt-1 text-sm">{plan.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {plan.rejectionComment && (
            <Card className="mt-4 border-muted bg-muted/10">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-semibold text-foreground/80">Head Coach Comment / Feedback</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm">{plan.rejectionComment}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
