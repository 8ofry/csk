import { getTranslations } from "next-intl/server";
import { listPublicChampions } from "@/application/public/service";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChampionShowcasePage() {
  const [t, champions] = await Promise.all([
    getTranslations("publicSite.champions"),
    listPublicChampions(),
  ]);

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {champions.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {champions.map((c) => (
            <Link
              key={c.id}
              // Dynamic route: typedRoutes accepts the literal `/champions/${string}`.
              href={`/champions/${c.id}` as Parameters<typeof Link>[0]["href"]}
              className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <Card className="transition group-hover:border-csk-gold">
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
                <CardContent>
                  <div className="mb-2 text-3xl font-extrabold text-csk-gold">
                    {c.record.display}
                  </div>
                  <div className="mb-3 text-xs text-muted-foreground">
                    {t("fights", { count: c.record.total })}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.record.methods.map((m) => (
                      <Badge key={m.method} variant="outline">
                        {m.method}: {m.count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
