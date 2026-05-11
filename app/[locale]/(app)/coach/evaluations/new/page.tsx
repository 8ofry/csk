import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { DetailedEvalForm } from "@/components/evaluations/detailed-eval-form";
import { createDetailedEvalAction } from "@/app/actions/detailed-eval";

export default async function NewDetailedEvalPage({
  searchParams,
}: {
  searchParams: Promise<{ traineeId?: string; groupId?: string }>;
}) {
  const user = await requireRole("COACH");
  const sp = await searchParams;
  if (!sp.traineeId || !sp.groupId) notFound();

  const [t, trainee, group] = await Promise.all([
    getTranslations("coachEvalNew"),
    prisma.user.findUnique({
      where: { id: sp.traineeId },
      select: { id: true, fullNameEn: true, fullNameAr: true, role: true },
    }),
    prisma.group.findUnique({
      where: { id: sp.groupId },
      include: { discipline: true },
    }),
  ]);

  if (!trainee || trainee.role !== "TRAINEE" || !group) notFound();
  if (group.primaryCoachId !== user.id) notFound();

  const skills =
    (group.discipline.skillsTaxonomy as { skills?: string[] } | null)?.skills ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <DetailedEvalForm
        traineeId={trainee.id}
        traineeName={`${trainee.fullNameEn} (${trainee.fullNameAr})`}
        groupId={group.id}
        groupName={group.name}
        skills={skills}
        onSubmit={createDetailedEvalAction}
        redirectTo={`/coach/sessions/${sp.groupId}`}
      />
    </div>
  );
}
