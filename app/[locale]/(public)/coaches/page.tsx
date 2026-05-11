import { getTranslations } from "next-intl/server";
import { listPublicCoaches } from "@/application/public/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublicCoachesPage() {
  const [t, coaches] = await Promise.all([
    getTranslations("publicSite.coaches"),
    listPublicCoaches(),
  ]);
  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {coaches.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {c.profilePhotoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={c.profilePhotoUrl}
                      alt={c.fullNameEn}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-csk-black/5 text-2xl text-csk-gold">
                      ⚔
                    </div>
                  )}
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">{c.fullNameEn}</CardTitle>
                    <p className="text-xs text-muted-foreground">{c.fullNameAr}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.disciplines.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {c.disciplines.map((d) => (
                      <Badge key={d} variant="outline">
                        {d}
                      </Badge>
                    ))}
                  </div>
                )}
                {c.locations.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {t("trainsAt")} {c.locations.join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
