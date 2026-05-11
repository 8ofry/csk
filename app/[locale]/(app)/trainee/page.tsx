import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export default async function TraineeDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (!session || session.user.role !== "TRAINEE") {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("trainee.dashboard");
  const tCommon = await getTranslations("common");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Panel title={t("panels.nextSession")} empty={tCommon("noResults")} />
        <Panel title={t("panels.latestReport")} empty={tCommon("noResults")} />
        <Panel title={t("panels.subscription")} empty={tCommon("noResults")} />
        <Panel title={t("panels.medical")} empty={tCommon("noResults")} />
      </div>
    </div>
  );
}

function Panel({ title, empty }: { title: string; empty: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{empty}</p>
    </div>
  );
}
