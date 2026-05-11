import { getTranslations } from "next-intl/server";
import { publicPricing } from "@/application/public/service";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PublicPricingPage() {
  const [t, data] = await Promise.all([getTranslations("publicSite.pricing"), publicPricing()]);

  return (
    <div className="container py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("noteContact")}</p>
      </div>

      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("includedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-csk-gold">⚔</span>
                <span>
                  <strong>
                    {t("include1Strong", { count: data.defaults.sessionsPerMonth })}
                  </strong>{" "}
                  {t("include1Suffix")}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-csk-gold">⚔</span>
                <span>{t("include2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-csk-gold">⚔</span>
                <span>{t("include3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-csk-gold">⚔</span>
                <span>{t("include4")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-csk-gold">⚔</span>
                <span>
                  <strong>{t("include5Strong")}</strong> {t("include5Suffix")}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("availableDisciplinesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.disciplines.map((d) => (
                <Badge key={d.id} variant="outline">
                  {d.nameEn}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md border border-csk-gold/40 bg-csk-gold/5 p-6 text-center">
          <p className="text-sm">{t("ctaInfo")}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button asChild>
              <Link href="/contact">{t("getPricing")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">{t("startTrial")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
