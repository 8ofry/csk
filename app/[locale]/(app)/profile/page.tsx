import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfilePhotoForm } from "@/components/profile/profile-photo-form";

export default async function ProfilePage() {
  const [session, locale] = await Promise.all([auth(), getLocale()]);
  if (!session?.user?.id) {
    redirect({ href: "/login", locale });
  }

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      fullNameEn: true,
      fullNameAr: true,
      email: true,
      phone: true,
      role: true,
      profilePhotoUrl: true,
    },
  });

  if (!user) {
    redirect({ href: "/login", locale });
  }

  const isAr = locale === "ar";
  const displayName = isAr ? user!.fullNameAr : user!.fullNameEn;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isAr ? "الملف الشخصي" : "My Profile"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAr
            ? "إدارة صورة الحساب ومعلومات الملف الشخصي."
            : "Manage your account avatar and profile information."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "صورة الحساب" : "Profile Avatar"}</CardTitle>
          <CardDescription>
            {isAr
              ? "تظهر صورتك في الشريط العلوي ولوحة التحكم. يتم عرض صورة افتراضية حتى تقوم بتحديثها."
              : "Shown in the top navigation bar. A default avatar is displayed until you upload your photo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfilePhotoForm
            initialPhotoUrl={user!.profilePhotoUrl}
            displayName={displayName}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "بيانات الحساب" : "Account Details"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? "الاسم بالإنجليزية" : "Name (English)"}</p>
            <p className="font-medium">{user!.fullNameEn}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? "الاسم بالعربية" : "Name (Arabic)"}</p>
            <p className="font-medium">{user!.fullNameAr}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</p>
            <p className="font-medium">{user!.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{isAr ? "الدور" : "Role"}</p>
            <Badge variant="outline" className="mt-0.5">{user!.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
