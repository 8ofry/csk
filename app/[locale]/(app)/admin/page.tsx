import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/infrastructure/db/prisma";

export default async function AdminDashboard() {
  const session = await auth();
  const locale = await getLocale();
  if (session?.user.role !== "ADMIN") {
    redirect({ href: "/", locale });
  }

  const t = await getTranslations("dashboards.admin");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    activeTrainees,
    mtdRevenueResult,
    mtdCskResult,
    overdue,
    expiringMedical,
    pendingUsers,
    pendingPlans,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        role: "TRAINEE",
        status: "ACTIVE",
      },
    }),
    prisma.payment.aggregate({
      _sum: { amountNet: true },
      where: {
        paidAt: { gte: startOfMonth },
      },
    }),
    prisma.revenueSplit.aggregate({
      _sum: { amount: true },
      where: {
        recipientType: "CSK",
        payment: {
          paidAt: { gte: startOfMonth },
        },
      },
    }),
    prisma.subscription.count({
      where: {
        paymentStatus: "OVERDUE",
        active: true,
      },
    }),
    prisma.medicalDocument.count({
      where: {
        status: "ACTIVE",
        expiryDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
      },
    }),
    prisma.user.count({
      where: { status: "PENDING" },
    }),
    prisma.sessionPlan.count({
      where: { status: "PENDING" },
    }),
    prisma.dailyReport.count({
      where: { status: "PENDING" },
    }),
  ]);

  const mtdRevenue = mtdRevenueResult._sum.amountNet ? Number(mtdRevenueResult._sum.amountNet) : 0;
  const mtdCsk = mtdCskResult._sum.amount ? Number(mtdCskResult._sum.amount) : 0;
  const pendingApprovals = pendingUsers + pendingPlans + pendingReports;

  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("subtitle")}</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label={t("kpi.activeTrainees")} value={activeTrainees.toLocaleString(numberLocale)} />
        <KpiCard label={t("kpi.mtdRevenue")} value={mtdRevenue.toLocaleString(numberLocale)} />
        <KpiCard label={t("kpi.mtdCsk")} value={mtdCsk.toLocaleString(numberLocale)} />
        <KpiCard label={t("kpi.overdue")} value={overdue.toLocaleString(numberLocale)} />
        <KpiCard label={t("kpi.expiringMedical")} value={expiringMedical.toLocaleString(numberLocale)} />
        <KpiCard label={t("kpi.pendingApprovals")} value={pendingApprovals.toLocaleString(numberLocale)} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-bold text-csk-gold">{value}</div>
    </div>
  );
}

