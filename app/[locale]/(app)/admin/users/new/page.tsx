import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { UserForm } from "@/components/admin/user-form";
import { createUserAction } from "@/app/actions/users";

export default async function NewUserPage() {
  await requireRole("HEAD_COACH");
  const t = await getTranslations("adminUsers.addUserPage");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>
      <UserForm onSubmit={createUserAction} submitLabel={t("title")} />
    </div>
  );
}
