// Subscription service (FR-FIN-01..05).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { periodForMonth } from "@/domain/financial/subscription-period";

export const subscriptionInputSchema = z.object({
  traineeId: z.string().min(1),
  groupId: z.string().min(1),
  monthlyFee: z.coerce.number().min(0),
  sessionsPerMonth: z.coerce.number().int().min(1).max(60).default(12),
  discountPercent: z.coerce.number().min(0).max(100).nullable().optional(),
  discountReason: z.string().optional().nullable(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
});

export type SubscriptionInput = z.infer<typeof subscriptionInputSchema>;

export async function listSubscriptionsForTrainee(traineeId: string) {
  return prisma.subscription.findMany({
    where: { traineeId },
    orderBy: [{ active: "desc" }, { currentPeriodStart: "desc" }],
    include: {
      group: { select: { id: true, name: true } },
      location: { select: { nameEn: true } },
      discipline: { select: { nameEn: true } },
    },
  });
}

export async function listAllSubscriptions(filters: { paymentStatus?: string } = {}) {
  return prisma.subscription.findMany({
    where: {
      active: true,
      paymentStatus: filters.paymentStatus
        ? (filters.paymentStatus as "PAID" | "PARTIAL" | "DUE" | "OVERDUE")
        : undefined,
    },
    orderBy: { currentPeriodEnd: "asc" },
    include: {
      trainee: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      group: { select: { name: true } },
      location: { select: { nameEn: true } },
      discipline: { select: { nameEn: true } },
    },
  });
}

export async function createSubscription(input: SubscriptionInput, actorId: string) {
  const data = subscriptionInputSchema.parse(input);
  const [yStr, mStr] = data.startMonth.split("-");
  const year = Number(yStr);
  const month = Number(mStr);
  const { start, end } = periodForMonth(year, month);

  const group = await prisma.group.findUnique({
    where: { id: data.groupId },
    select: { id: true, locationId: true, disciplineId: true },
  });
  if (!group) throw new Error("Group not found");

  const created = await prisma.subscription.create({
    data: {
      traineeId: data.traineeId,
      groupId: group.id,
      locationId: group.locationId,
      disciplineId: group.disciplineId,
      monthlyFee: data.monthlyFee,
      sessionsPerMonth: data.sessionsPerMonth,
      discountPercent: data.discountPercent ?? null,
      discountReason: data.discountReason ?? null,
      currentPeriodStart: start,
      currentPeriodEnd: end,
      paymentStatus: "DUE",
      active: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "subscription.create",
      entityType: "Subscription",
      entityId: created.id,
    },
  });

  return created;
}

export async function archiveSubscription(id: string, actorId: string) {
  const updated = await prisma.subscription.update({
    where: { id },
    data: { active: false },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "subscription.archive",
      entityType: "Subscription",
      entityId: id,
    },
  });
  return updated;
}
