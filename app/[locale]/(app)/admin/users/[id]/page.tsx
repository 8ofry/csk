import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getUser } from "@/application/users/service";
import { requireRole } from "@/lib/auth-guard";
import { UserForm } from "@/components/admin/user-form";
import { updateUserAction } from "@/app/actions/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("HEAD_COACH");
  const { id } = await params;

  const [t, locale, user] = await Promise.all([
    getTranslations("adminUsers.editUserPage"),
    getLocale(),
    getUser(id),
  ]);

  if (!user) notFound();

  const update = updateUserAction.bind(null, id);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{locale === "ar" ? user.fullNameAr : user.fullNameEn}</h1>
        <p className="text-muted-foreground">
          {locale === "ar" ? user.fullNameEn : user.fullNameAr} · {user.role}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm
            defaultValues={{
              fullNameAr: user.fullNameAr,
              fullNameEn: user.fullNameEn,
              phone: user.phone ?? undefined,
              email: user.email,
              role: user.role,
              status: user.status,
              parentManaged: user.parentManaged,
            }}
            onSubmit={update}
            submitLabel={t("title")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
