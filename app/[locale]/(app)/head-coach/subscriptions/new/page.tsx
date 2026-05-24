import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";
import { listGroups } from "@/application/groups/service";
import { listActiveTrainees } from "@/application/users/directory";
import { SubscriptionForm } from "@/components/head-coach/subscription-form";
import { createSubscriptionAction } from "@/app/actions/subscriptions";

export default async function NewSubscriptionPage() {
  await requireRole("HEAD_COACH");
  const [t, groups, trainees] = await Promise.all([
    getTranslations("hcSubsNew"),
    listGroups({ active: true }),
    listActiveTrainees(),
  ]);

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SubscriptionForm
        trainees={trainees}
        groups={groups.map((g) => ({
          id: g.id,
          label: `${g.name} — ${g.discipline.nameEn} @ ${g.location.nameEn}`,
        }))}
        defaultStartMonth={defaultMonth}
        onSubmit={createSubscriptionAction}
      />
    </div>
  );
}
