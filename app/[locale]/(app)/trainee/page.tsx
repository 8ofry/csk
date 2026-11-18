import { auth } from "@/auth";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/db/prisma";
import { getTraineeProgression } from "@/application/progression/service";
import { formatReferralCode } from "@/domain/financial/bundles";
import { ProgressionCard } from "@/components/trainee/progression-card";

export default async function TraineeDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (!session || session.user.role !== "TRAINEE") {
    redirect({ href: "/", locale });
    return null;
  }

  const userId = session.user.id;
  const [t, tCommon, enrollments, latestSub, latestReport, medical, progression] = await Promise.all([
    getTranslations("trainee.dashboard"),
    getTranslations("common"),
    prisma.enrollment.findMany({
      where: { traineeId: userId, status: "ACTIVE" },
      include: {
        group: { include: { location: { select: { nameEn: true, nameAr: true } } } },
      },
      take: 3,
    }),
    prisma.subscription.findFirst({
      where: { traineeId: userId },
      orderBy: { currentPeriodEnd: "desc" },
      include: { group: { select: { name: true } } },
    }),
    prisma.monthlyReport.findFirst({
      where: { traineeId: userId, status: "APPROVED" },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    }),
    prisma.medicalRecord.findUnique({
      where: { traineeId: userId },
      select: { bloodType: true, lastUpdatedAt: true },
    }),
    getTraineeProgression(userId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <ProgressionCard
        progression={progression}
        referralCode={formatReferralCode(userId)}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.nextSession")}</h2>
            <Link href="/trainee/schedule" className="text-xs text-csk-gold hover:underline">
              View schedule
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {enrollments.map((e) => (
                <li key={e.id}>
                  <span className="font-medium">{e.group.name}</span>{" "}
                  <span className="text-muted-foreground">
                    · {locale === "ar" ? e.group.location.nameAr : e.group.location.nameEn}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.latestReport")}</h2>
            <Link href="/trainee/reports" className="text-xs text-csk-gold hover:underline">
              All reports
            </Link>
          </div>
          {latestReport ? (
            <p className="text-sm">
              {latestReport.periodYear}-{String(latestReport.periodMonth).padStart(2, "0")} ·{" "}
              <span className="text-muted-foreground">Approved</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.subscription")}</h2>
            <Link href="/trainee/payments" className="text-xs text-csk-gold hover:underline">
              Payments
            </Link>
          </div>
          {latestSub ? (
            <div className="text-sm space-y-1">
              <p className="font-medium">{latestSub.group.name}</p>
              <p className="text-muted-foreground">
                Status: {latestSub.paymentStatus} · Ends {latestSub.currentPeriodEnd.toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("panels.medical")}</h2>
            <Link href="/trainee/medical" className="text-xs text-csk-gold hover:underline">
              Medical file
            </Link>
          </div>
          {medical ? (
            <p className="text-sm">
              Updated: <span className="font-medium">{medical.lastUpdatedAt.toLocaleDateString()}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">{tCommon("noResults")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
