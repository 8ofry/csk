import { getTranslations } from "next-intl/server";
import { listPublicLocations } from "@/application/public/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicLocationsPage() {
  const [t, locations] = await Promise.all([
    getTranslations("publicSite.locations"),
    listPublicLocations(),
  ]);

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {locations.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>{loc.nameEn}</CardTitle>
                    <p className="text-sm text-muted-foreground">{loc.nameAr}</p>
                  </div>
                  {loc.ownership === "CSK_OWNED" && <Badge>{t("cskHome")}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("districtLabel")}
                  </div>
                  <div>{loc.district}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {t("addressLabel")}
                  </div>
                  <div className="text-sm">{loc.address}</div>
                </div>
                {loc.contactPhone && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">
                      {t("contactLabel")}
                    </div>
                    <a
                      href={`tel:${loc.contactPhone}`}
                      className="text-csk-gold hover:underline"
                    >
                      {loc.contactPhone}
                    </a>
                  </div>
                )}
                {loc.latitude && loc.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-csk-gold hover:underline"
                  >
                    {t("openMaps")}
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
