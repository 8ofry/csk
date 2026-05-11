import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { MerchandiseForm } from "@/components/head-coach/merchandise-form";
import { createMerchandiseAction } from "@/app/actions/merchandise";

export default async function NewMerchandisePage() {
  await requireRole("HEAD_COACH");
  const t = await getTranslations("hcMerchDetail.newPage");
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <MerchandiseForm onSubmit={createMerchandiseAction} submitLabel={t("submit")} />
    </div>
  );
}
