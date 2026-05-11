import { getTranslations } from "next-intl/server";
import { listPublicDisciplines } from "@/application/public/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Category = "BOXING" | "KICKBOXING" | "MMA" | "KARATE" | "FITNESS" | "OTHER";

export default async function PublicDisciplinesPage() {
  const [t, disciplines] = await Promise.all([
    getTranslations("publicSite.disciplines"),
    listPublicDisciplines(),
  ]);

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {disciplines.map((d) => {
          const cat = (d.category as Category) ?? "OTHER";
          return (
            <Card key={d.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle>{d.nameEn}</CardTitle>
                  <Badge variant="outline">{d.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{d.nameAr}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{t(`summaries.${cat}`)}</p>
                <div className="mt-3 text-xs text-muted-foreground">
                  {t("groupCount", { count: d._count.groups })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
