import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-csk-gold">{t("title")}</h1>
        <LoginForm />
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-csk-gold hover:underline">
            {t("forgot")}
          </Link>
          <span>
            {t("noAccount")}{" "}
            <Link href="/register" className="text-csk-gold hover:underline">
              {t("signUp")}
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
