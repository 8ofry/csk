import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { CertificatesTimeline } from "@/components/certificates/certificates-timeline";

export default async function TraineeCertificatesPage() {
  const user = await requireRole("TRAINEE");
  const t = await getTranslations("trainee.certificates");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <CertificatesTimeline userId={user.id} emptyMessage={t("empty")} />
    </div>
  );
}
