import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { LocationForm } from "@/components/admin/location-form";
import { createLocationAction } from "@/app/actions/locations";

export default async function NewLocationPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("adminLocations.newPage");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <LocationForm onSubmit={createLocationAction} submitLabel={t("submit")} />
    </div>
  );
}
