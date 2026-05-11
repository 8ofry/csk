import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-csk-gold">{t("title")}</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
