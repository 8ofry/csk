import { prisma } from "@/infrastructure/db/prisma";

export async function getGtmKpis() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeTrainees,
    activeSubs,
    paidSubs,
    dropInPayments,
    privateSessionsMonth,
    coachRatings,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "TRAINEE", status: "ACTIVE" } }),
    prisma.subscription.count({ where: { active: true } }),
    prisma.subscription.count({ where: { active: true, paymentStatus: "PAID" } }),
    prisma.payment.findMany({
      where: { revenueType: "DROP_IN", refundedAt: null },
      select: { payerUserId: true },
      distinct: ["payerUserId"],
    }),
    prisma.privateSession.count({
      where: { scheduledStart: { gte: monthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.coachEvaluation.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const dropInUserIds = dropInPayments.map((p) => p.payerUserId);
  const convertedDropIns =
    dropInUserIds.length > 0
      ? await prisma.subscription.count({
          where: { traineeId: { in: dropInUserIds } },
        })
      : 0;

  return {
    activeTrainees,
    activeSubscriptions: activeSubs,
    onTimePaidRate: activeSubs > 0 ? Math.round((paidSubs / activeSubs) * 100) : 0,
    dropInTrials: dropInUserIds.length,
    convertedDropIns,
    trialConversionRate:
      dropInUserIds.length > 0
        ? Math.round((convertedDropIns / dropInUserIds.length) * 100)
        : 0,
    privateSessionsMonth,
    avgCoachRating: coachRatings._avg.rating
      ? Math.round(coachRatings._avg.rating * 10) / 10
      : null,
    coachRatingCount: coachRatings._count.rating,
  };
}
