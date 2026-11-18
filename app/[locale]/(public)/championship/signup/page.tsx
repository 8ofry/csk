import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function ChampionshipSignupRedirectPage() {
  const locale = await getLocale();
  redirect({ href: "/championships/register", locale });
}
