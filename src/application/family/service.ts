import { prisma } from "@/infrastructure/db/prisma";

export async function getFamilyOverview(parentUserId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const children = await prisma.user.findMany({
    where: { parentUserId, status: { not: "SUSPENDED" } },
    select: {
      id: true,
      fullNameEn: true,
      fullNameAr: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          group: {
            select: {
              name: true,
              discipline: { select: { nameEn: true } },
              location: { select: { nameEn: true } },
            },
          },
        },
      },
      subscriptions: {
        orderBy: { currentPeriodEnd: "desc" },
        take: 1,
        select: {
          id: true,
          monthlyFee: true,
          billingCycle: true,
          paymentStatus: true,
          currentPeriodEnd: true,
        },
      },
      medicalDocuments: {
        where: { status: "ACTIVE" },
        orderBy: { expiryDate: "desc" },
        take: 1,
        select: { expiryDate: true },
      },
      attendances: {
        where: { markedAt: { gte: thirtyDaysAgo }, status: { in: ["PRESENT", "LATE"] } },
        select: { id: true },
      },
    },
    orderBy: { fullNameEn: "asc" },
  });

  return children.map((c) => {
    const medExp = c.medicalDocuments[0]?.expiryDate ?? null;
    const medValid = medExp !== null && medExp > now;
    return {
      id: c.id,
      fullNameEn: c.fullNameEn,
      fullNameAr: c.fullNameAr,
      enrollments: c.enrollments,
      latestSubscription: c.subscriptions[0] ?? null,
      medValid,
      medExpiry: medExp,
      monthAttended: c.attendances.length,
    };
  });
}
