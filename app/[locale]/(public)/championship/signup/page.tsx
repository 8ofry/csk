import { getTranslations } from "next-intl/server";
import { ExternalSignupForm } from "@/components/championship/external-signup-form";

export default async function ChampionshipSignupPage() {
  const t = await getTranslations("championshipSignup");

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-csk-gold text-center">{t("title")}</h1>
        <p className="text-muted-foreground text-center mt-2">{t("subtitle")}</p>
        <ExternalSignupForm />
      </div>
    </div>
  );
}
