// Dashboard aggregations (FR-FIN-10..12).

import { prisma } from "@/infrastructure/db/prisma";

export interface DateWindow {
  from: Date;
  to: Date;
}

interface ByStream {
  revenueType: string;
  count: number;
  net: number;
}

export async function coachEarnings(coachUserId: string, window: DateWindow) {
  const splits = await prisma.revenueSplit.findMany({
    where: {
      recipientType: "COACH",
      recipientUserId: coachUserId,
      payment: { paidAt: { gte: window.from, lte: window.to } },
    },
    include: {
      payment: {
        select: { id: true, revenueType: true, paidAt: true, amountNet: true },
      },
    },
    orderBy: { computedAt: "desc" },
  });

  const total = splits.reduce((s, x) => s + Number(x.amount), 0);
  const byStream = new Map<string, { count: number; net: number }>();
  for (const s of splits) {
    const key = s.payment.revenueType;
    const cur = byStream.get(key) ?? { count: 0, net: 0 };
    cur.count += 1;
    cur.net += Number(s.amount);
    byStream.set(key, cur);
  }

  return {
    total,
    byStream: [...byStream.entries()].map(
      ([revenueType, v]): ByStream => ({ revenueType, count: v.count, net: v.net }),
    ),
    transactions: splits.map((s) => ({
      paymentId: s.payment.id,
      revenueType: s.payment.revenueType,
      paidAt: s.payment.paidAt,
      amount: Number(s.amount),
      percent: Number(s.percent),
    })),
  };
}

export interface OwnerSnapshot {
  totalRevenue: number;
  cskShare: number;
  venueShare: number;
  coachShare: number;
  otherShare: number;
  byLocation: { locationId: string; locationName: string; gross: number; csk: number }[];
  byStream: ByStream[];
  outstandingReceivables: { count: number; total: number };
  totalExpenses: number;
  netProfit: number;
}

export async function ownerSnapshot(window: DateWindow): Promise<OwnerSnapshot> {
  const grossRow = await prisma.payment.aggregate({
    where: { paidAt: { gte: window.from, lte: window.to } },
    _sum: { amountNet: true },
  });
  const totalRevenue = Number(grossRow._sum.amountNet ?? 0);

  const splitGroups = await prisma.revenueSplit.groupBy({
    by: ["recipientType"],
    where: { payment: { paidAt: { gte: window.from, lte: window.to } } },
    _sum: { amount: true },
  });
  const sumFor = (type: string) =>
    Number(splitGroups.find((g) => g.recipientType === type)?._sum.amount ?? 0);

  const cskShare = sumFor("CSK");
  const venueShare = sumFor("VENUE");
  const coachShare = sumFor("COACH");
  const otherShare =
    sumFor("FEDERATION") + sumFor("TAX_ADMIN") + sumFor("DISCIPLINE_OWNER");

  const byStreamRows = await prisma.payment.groupBy({
    by: ["revenueType"],
    where: { paidAt: { gte: window.from, lte: window.to } },
    _sum: { amountNet: true },
    _count: { _all: true },
  });
  const byStream: ByStream[] = byStreamRows.map((r) => ({
    revenueType: r.revenueType,
    count: r._count._all,
    net: Number(r._sum.amountNet ?? 0),
  }));

  // Per-location P&L:
  //   gross  = sum of payment.amountNet attributable to a location (subscription/private/merchandise)
  //   cskAtLoc = gross - venue cut for that location (i.e. what stays with CSK after the venue split)
  const paymentsInWindow = await prisma.payment.findMany({
    where: { paidAt: { gte: window.from, lte: window.to } },
    select: {
      amountNet: true,
      subscription: { select: { locationId: true } },
      privateSession: { select: { locationId: true } },
      merchandiseSale: { select: { locationId: true } },
    },
  });

  const grossByLocation = new Map<string, number>();
  for (const p of paymentsInWindow) {
    const loc =
      p.subscription?.locationId ??
      p.privateSession?.locationId ??
      p.merchandiseSale?.locationId ??
      null;
    if (!loc) continue;
    grossByLocation.set(loc, (grossByLocation.get(loc) ?? 0) + Number(p.amountNet));
  }

  const venueSplitByLocation = await prisma.revenueSplit.groupBy({
    by: ["recipientLocationId"],
    where: {
      recipientType: "VENUE",
      payment: { paidAt: { gte: window.from, lte: window.to } },
    },
    _sum: { amount: true },
  });
  const venueByLoc = new Map<string, number>(
    venueSplitByLocation
      .filter((r) => r.recipientLocationId)
      .map((r) => [r.recipientLocationId!, Number(r._sum.amount ?? 0)]),
  );

  const locationIds = [
    ...new Set([...grossByLocation.keys(), ...venueByLoc.keys()]),
  ];
  const locations = locationIds.length
    ? await prisma.location.findMany({
        where: { id: { in: locationIds } },
        select: { id: true, nameEn: true },
      })
    : [];
  const byLocation = locations.map((l) => {
    const gross = grossByLocation.get(l.id) ?? 0;
    const venueAtLoc = venueByLoc.get(l.id) ?? 0;
    return {
      locationId: l.id,
      locationName: l.nameEn,
      gross,
      csk: gross - venueAtLoc,
    };
  });

  const expensesRow = await prisma.expense.aggregate({
    where: { paidAt: { gte: window.from, lte: window.to } },
    _sum: { amount: true },
  });
  const totalExpenses = Number(expensesRow._sum.amount ?? 0);
  const netProfit = cskShare - totalExpenses;

  const overdue = await prisma.subscription.aggregate({
    where: { paymentStatus: { in: ["DUE", "OVERDUE"] }, active: true },
    _count: { _all: true },
    _sum: { monthlyFee: true },
  });

  return {
    totalRevenue,
    cskShare,
    venueShare,
    coachShare,
    otherShare,
    byLocation,
    byStream,
    outstandingReceivables: {
      count: overdue._count._all,
      total: Number(overdue._sum.monthlyFee ?? 0),
    },
    totalExpenses,
    netProfit,
  };
}
