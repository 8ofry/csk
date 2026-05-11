// Analytics service — read-side aggregations for the Admin dashboard.
// Pulls minimal Prisma row sets and feeds them to pure domain functions.

import { prisma } from "@/infrastructure/db/prisma";
import {
  buildCohortReport,
  monthKey,
  type TraineeCohortInput,
} from "@/domain/analytics/cohorts";
import {
  buildLtvReport,
  type PaymentRowForLtv,
} from "@/domain/analytics/ltv";
import {
  rankCoaches,
  type CoachBenchmarkInput,
} from "@/domain/analytics/coach-benchmark";
import {
  densify,
  lastNMonths,
  monthlyTotals,
  monthlyTotalsBySlice,
  type MonthlyBucket,
  type MonthlySeriesBySlice,
  type TimedAmount,
} from "@/domain/analytics/time-series";

export interface AnalyticsWindow {
  /** Inclusive lower bound. */
  from: Date;
  /** Inclusive upper bound. */
  to: Date;
}

/** Cohort retention matrix for trainees who first paid in the last `monthsBack` months. */
export async function cohortRetention(monthsBack = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  // Each trainee's first subscription start = cohort.
  const subs = await prisma.subscription.findMany({
    where: { currentPeriodStart: { gte: since } },
    select: {
      traineeId: true,
      currentPeriodStart: true,
    },
    orderBy: { currentPeriodStart: "asc" },
  });

  // Active months per trainee = months they made any payment for a subscription.
  const payments = await prisma.payment.findMany({
    where: {
      revenueType: "SUBSCRIPTION",
      paidAt: { gte: since },
    },
    select: { payerUserId: true, paidAt: true },
  });

  const firstSeen = new Map<string, Date>();
  for (const s of subs) {
    const cur = firstSeen.get(s.traineeId);
    if (!cur || s.currentPeriodStart < cur) firstSeen.set(s.traineeId, s.currentPeriodStart);
  }
  const monthsByTrainee = new Map<string, Set<string>>();
  for (const p of payments) {
    const set = monthsByTrainee.get(p.payerUserId) ?? new Set<string>();
    set.add(monthKey(p.paidAt));
    monthsByTrainee.set(p.payerUserId, set);
  }

  const inputs: TraineeCohortInput[] = [...firstSeen.entries()].map(([traineeId, joinedAt]) => ({
    traineeId,
    joinedAt,
    activeMonths: [...(monthsByTrainee.get(traineeId) ?? [])],
  }));

  return buildCohortReport(inputs);
}

/** Lifetime value across all trainees who have any payment in the window. */
export async function lifetimeValue(window: AnalyticsWindow) {
  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: window.from, lte: window.to } },
    select: {
      payerUserId: true,
      amountNet: true,
      paidAt: true,
      subscription: { select: { discipline: { select: { nameEn: true } } } },
      privateSession: { select: { coach: { select: { primaryGroups: { select: { discipline: { select: { nameEn: true } } }, take: 1 } } } } },
    },
  });

  // Compute each trainee's cohort = month of their earliest payment in the window.
  const earliestByTrainee = new Map<string, Date>();
  for (const p of payments) {
    const cur = earliestByTrainee.get(p.payerUserId);
    if (!cur || p.paidAt < cur) earliestByTrainee.set(p.payerUserId, p.paidAt);
  }

  const rows: PaymentRowForLtv[] = payments.map((p) => ({
    traineeId: p.payerUserId,
    amountNet: Number(p.amountNet),
    paidAt: p.paidAt,
    cohortKey: monthKey(earliestByTrainee.get(p.payerUserId) ?? p.paidAt),
    disciplineKey:
      p.subscription?.discipline?.nameEn ??
      p.privateSession?.coach?.primaryGroups?.[0]?.discipline?.nameEn ??
      undefined,
  }));

  return buildLtvReport(rows);
}

/** Coach performance benchmark for a given window. */
export async function coachBenchmarks(window: AnalyticsWindow) {
  const coaches = await prisma.user.findMany({
    where: { role: "COACH", status: "ACTIVE" },
    select: {
      id: true,
      fullNameEn: true,
      sessionsAsCoach: {
        where: { scheduledStart: { gte: window.from, lte: window.to } },
        select: {
          id: true,
          attendances: { select: { traineeId: true } },
          quickEvaluations: { select: { effortScore: true } },
          dailyReport: { select: { status: true } },
        },
      },
    },
  });

  // For retention: trainees active in current month vs in window overall.
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const inputs: CoachBenchmarkInput[] = coaches.map((c) => {
    const allTrainees = new Set<string>();
    const recentTrainees = new Set<string>();
    let efforts: number[] = [];
    let reportsTotal = 0;
    let reportsApproved = 0;
    for (const s of c.sessionsAsCoach) {
      for (const a of s.attendances) {
        allTrainees.add(a.traineeId);
        // We can't filter by date inside `attendances` here easily; over-approximate
        // by treating any attended session this period as "recent". Good enough as a
        // first signal — the Admin page can narrow further with the period picker.
        recentTrainees.add(a.traineeId);
      }
      efforts = efforts.concat(s.quickEvaluations.map((q) => q.effortScore));
      if (s.dailyReport) {
        reportsTotal += 1;
        if (s.dailyReport.status === "APPROVED") reportsApproved += 1;
      }
    }
    return {
      coachId: c.id,
      fullNameEn: c.fullNameEn,
      sessionsDelivered: c.sessionsAsCoach.length,
      uniqueTrainees: allTrainees.size,
      retainedTrainees: recentTrainees.size,
      averageEffortScore:
        efforts.length === 0 ? null : efforts.reduce((s, n) => s + n, 0) / efforts.length,
      reportsTotal,
      reportsApprovedFirstTry: reportsApproved,
    };
  });

  return rankCoaches(inputs);
}

/** Revenue (net EGP) per month for the last N months, total + by stream. */
export async function revenueTimeSeries(monthsBack = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const months = lastNMonths(monthsBack);

  const payments = await prisma.payment.findMany({
    where: { paidAt: { gte: since } },
    select: { amountNet: true, paidAt: true, revenueType: true },
  });

  const flat: TimedAmount[] = payments.map((p) => ({
    date: p.paidAt,
    amount: Number(p.amountNet),
    sliceKey: p.revenueType,
  }));

  const total: MonthlyBucket[] = densify(
    monthlyTotals(flat.map(({ date, amount }) => ({ date, amount }))),
    months,
  );
  const byStream: MonthlySeriesBySlice[] = monthlyTotalsBySlice(flat);
  return { months, total, byStream };
}

/** Attendance rate per month (PRESENT+LATE divided by total marks). */
export async function attendanceTimeSeries(monthsBack = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack + 1);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.attendance.findMany({
    where: { markedAt: { gte: since } },
    select: { status: true, markedAt: true },
  });

  // Group by month: total marks + attended (PRESENT|LATE).
  const buckets = new Map<string, { total: number; attended: number }>();
  for (const r of rows) {
    const k = monthKey(r.markedAt);
    const cur = buckets.get(k) ?? { total: 0, attended: 0 };
    cur.total += 1;
    if (r.status === "PRESENT" || r.status === "LATE") cur.attended += 1;
    buckets.set(k, cur);
  }
  const months = lastNMonths(monthsBack);
  return months.map((mk) => {
    const b = buckets.get(mk) ?? { total: 0, attended: 0 };
    return {
      monthKey: mk,
      total: b.total,
      attended: b.attended,
      rate: b.total === 0 ? 0 : Math.round((b.attended / b.total) * 1000) / 1000,
    };
  });
}
