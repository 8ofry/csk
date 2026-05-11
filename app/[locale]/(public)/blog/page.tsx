import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function BlogPlaceholderPage() {
  const t = await getTranslations("publicSite.blog");
  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("comingSoon")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{t("comingBody")}</p>
          <Link
            href="/contact"
            className="inline-block rounded-md bg-csk-gold px-4 py-2 font-semibold text-csk-black hover:bg-csk-goldLight"
          >
            {t("notify")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
