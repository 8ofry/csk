import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AboutPage() {
  const t = await getTranslations("publicSite.about");

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("established")}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("storyTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>{t("storyP1")}</p>
            <p>{t("storyP2")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("differentiatorsTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-relaxed">
              {(["diff1", "diff2", "diff3", "diff4"] as const).map((k) => (
                <li key={k} className="flex items-start gap-3">
                  <span className="text-xl text-csk-gold">⚔</span>
                  <span>{t(k)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("disciplinesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{t("disciplinesBody")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
