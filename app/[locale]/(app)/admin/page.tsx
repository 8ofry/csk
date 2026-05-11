import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AdminDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (session?.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("dashboards.admin");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={t("kpi.activeTrainees")} value="—" />
        <KpiCard label={t("kpi.mtdRevenue")} value="—" />
        <KpiCard label={t("kpi.mtdCsk")} value="—" />
        <KpiCard label={t("kpi.overdue")} value="—" />
        <KpiCard label={t("kpi.expiringMedical")} value="—" />
        <KpiCard label={t("kpi.pendingApprovals")} value="—" />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-csk-gold">{value}</div>
    </div>
  );
}
