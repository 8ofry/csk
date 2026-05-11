import { getTranslations } from "next-intl/server";
import { listMerchandise } from "@/application/merchandise/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";

export default async function PublicMerchandisePage() {
  const [t, all] = await Promise.all([
    getTranslations("publicSite.merchandise"),
    listMerchandise({ activeOnly: true }),
  ]);
  const items = all.filter((i) => i.stockLevel > 0);

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">
          {t("subtitle")}{" "}
          <Link href="/contact" className="text-csk-gold hover:underline">
            {t("subtitleContact")}
          </Link>{" "}
          {t("subtitleTrailing")}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="text-base">{item.nameEn}</CardTitle>
                <p className="text-xs text-muted-foreground">{item.nameAr}</p>
              </CardHeader>
              <CardContent>
                {item.photos.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photos[0]}
                    alt={item.nameEn}
                    className="mb-3 aspect-square w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-3 flex aspect-square w-full items-center justify-center rounded-md bg-csk-black/5 text-4xl text-csk-gold">
                    ⚔
                  </div>
                )}
                {item.description && (
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-csk-gold">
                    {Number(item.salePrice).toFixed(0)} EGP
                  </span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
