// Payment service (FR-FIN-03..12).
//   - Logs a payment of any RevenueType
//   - Resolves the applicable split rule (location + coach contract)
//   - Computes splits via the engine (sum-to-100% invariant enforced)
//   - Persists Payment + RevenueSplit rows in a single transaction
//   - Updates the subscription paymentStatus when the payment is for a subscription
//   - Generates a unique receipt number

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { computeSplit } from "@/domain/financial/split-engine";
import { resolveSplitRules } from "@/domain/financial/rule-resolver";
import { deriveStatus } from "@/domain/financial/subscription-period";

export const logPaymentSchema = z.object({
  revenueType: z.enum([
    "SUBSCRIPTION",
    "PRIVATE_SESSION",
    "BELT_EXAM",
    "CHAMPIONSHIP",
    "MERCHANDISE",
  ]),
  payerUserId: z.string().min(1),
  amountGross: z.coerce.number().min(0.01),
  method: z.enum(["CASH", "VODAFONE_CASH", "BANK_TRANSFER", "ONLINE"]),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
  // Reference depending on revenue type:
  subscriptionId: z.string().optional(),
  privateSessionId: z.string().optional(),
  championshipRegistrationId: z.string().optional(),
  beltExamResultId: z.string().optional(),
  merchandiseSaleId: z.string().optional(),
  // For revenue types that don't carry their own location/coach context:
  locationId: z.string().optional(),
  coachUserId: z.string().optional(),
  disciplineId: z.string().optional(),
});

export type LogPaymentInput = z.infer<typeof logPaymentSchema>;

export class PaymentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentValidationError";
  }
}

interface PaymentContext {
  locationId: string;
  disciplineId: string | null;
  coachUserId: string | null;
}

async function resolveContext(input: LogPaymentInput): Promise<PaymentContext> {
  switch (input.revenueType) {
    case "SUBSCRIPTION": {
      if (!input.subscriptionId) throw new PaymentValidationError("subscriptionId required");
      const sub = await prisma.subscription.findUnique({
        where: { id: input.subscriptionId },
        select: {
          locationId: true,
          disciplineId: true,
          group: { select: { primaryCoachId: true } },
        },
      });
      if (!sub) throw new PaymentValidationError("Subscription not found");
      return {
        locationId: sub.locationId,
        disciplineId: sub.disciplineId,
        coachUserId: sub.group.primaryCoachId,
      };
    }
    case "PRIVATE_SESSION": {
      if (!input.privateSessionId)
        throw new PaymentValidationError("privateSessionId required");
      const ps = await prisma.privateSession.findUnique({
        where: { id: input.privateSessionId },
        select: { locationId: true, coachId: true },
      });
      if (!ps) throw new PaymentValidationError("Private session not found");
      return { locationId: ps.locationId, disciplineId: null, coachUserId: ps.coachId };
    }
    case "BELT_EXAM": {
      if (!input.beltExamResultId)
        throw new PaymentValidationError("beltExamResultId required");
      const r = await prisma.beltExamResult.findUnique({
        where: { id: input.beltExamResultId },
        select: { exam: { select: { disciplineId: true } } },
      });
      if (!r) throw new PaymentValidationError("Belt exam result not found");
      if (!input.locationId)
        throw new PaymentValidationError("locationId required for belt exam payment");
      return {
        locationId: input.locationId,
        disciplineId: r.exam.disciplineId,
        coachUserId: input.coachUserId ?? null,
      };
    }
    case "CHAMPIONSHIP": {
      if (!input.championshipRegistrationId)
        throw new PaymentValidationError("championshipRegistrationId required");
      if (!input.locationId)
        throw new PaymentValidationError("locationId required for championship payment");
      return {
        locationId: input.locationId,
        disciplineId: input.disciplineId ?? null,
        coachUserId: input.coachUserId ?? null,
      };
    }
    case "MERCHANDISE": {
      if (!input.merchandiseSaleId)
        throw new PaymentValidationError("merchandiseSaleId required");
      const sale = await prisma.merchandiseSale.findUnique({
        where: { id: input.merchandiseSaleId },
        select: { locationId: true },
      });
      if (!sale) throw new PaymentValidationError("Sale not found");
      // Per §10.1 and §10.2 example 6: merchandise = 100% CSK regardless of location.
      // We still record locationId so reports can group sales by venue if needed.
      return {
        locationId: sale.locationId ?? input.locationId ?? "",
        disciplineId: null,
        coachUserId: null,
      };
    }
  }
}

async function generateReceiptNumber() {
  // Simple monotonic per-day counter: CSK-YYYYMMDD-NNNN
  const today = new Date();
  const yyyymmdd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const count = await prisma.payment.count({ where: { paidAt: { gte: start } } });
  return `CSK-${yyyymmdd}-${String(count + 1).padStart(4, "0")}`;
}

export async function logPayment(input: LogPaymentInput, actorId: string) {
  const data = logPaymentSchema.parse(input);
  const ctx = await resolveContext(data);

  // Find the location's split rule for this revenue type
  const locationRule = await prisma.locationSplitRule.findFirst({
    where: {
      locationId: ctx.locationId,
      revenueType: data.revenueType,
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!locationRule) {
    throw new PaymentValidationError(
      `No split rule configured at this location for ${data.revenueType}`,
    );
  }

  // Coach contract for this stream + location
  const coachContract = ctx.coachUserId
    ? await prisma.coachContract.findFirst({
        where: {
          coachId: ctx.coachUserId,
          active: true,
          OR: [{ locationId: ctx.locationId }, { locationId: null }],
        },
        orderBy: [{ locationId: "desc" }],
      })
    : null;

  const rules = resolveSplitRules({
    revenueType: data.revenueType,
    locationRule: {
      revenueType: locationRule.revenueType,
      venuePercent: Number(locationRule.venuePercent),
      cskPercent: Number(locationRule.cskPercent),
      coachPercent: Number(locationRule.coachPercent),
      otherPercent: Number(locationRule.otherPercent),
      otherLabel: locationRule.otherLabel,
    },
    coachContract: coachContract
      ? {
          subscriptionPercent: numOrNull(coachContract.subscriptionPercent),
          privateSessionPercent: numOrNull(coachContract.privateSessionPercent),
          privateSessionFixedRate: numOrNull(coachContract.privateSessionFixedRate),
          beltExamPercent: numOrNull(coachContract.beltExamPercent),
          championshipPercent: numOrNull(coachContract.championshipPercent),
        }
      : null,
    recipientCoachUserId: ctx.coachUserId ?? undefined,
    recipientLocationId: ctx.locationId,
  });

  const splitResult = computeSplit({
    grossAmount: data.amountGross,
    rules,
  });

  const receiptNumber = await generateReceiptNumber();

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        revenueType: data.revenueType,
        payerUserId: data.payerUserId,
        amountGross: new Prisma.Decimal(splitResult.grossAmount),
        amountNet: new Prisma.Decimal(splitResult.netAmount),
        method: data.method,
        receiptNumber,
        paidAt: data.paidAt ?? new Date(),
        loggedById: actorId,
        notes: data.notes ?? null,
        subscriptionId: data.subscriptionId,
        privateSessionId: data.privateSessionId,
        championshipRegId: data.championshipRegistrationId,
        beltExamResultId: data.beltExamResultId,
        merchandiseSaleId: data.merchandiseSaleId,
      },
    });

    for (const split of splitResult.splits) {
      await tx.revenueSplit.create({
        data: {
          paymentId: payment.id,
          recipientType: split.recipientType,
          recipientUserId: split.recipientUserId ?? null,
          recipientLocationId: split.recipientLocationId ?? null,
          recipientLabel: split.label ?? null,
          percent: new Prisma.Decimal(split.percent),
          amount: new Prisma.Decimal(split.amount),
        },
      });
    }

    // Update subscription payment status if relevant
    if (data.revenueType === "SUBSCRIPTION" && data.subscriptionId) {
      const sub = await tx.subscription.findUnique({
        where: { id: data.subscriptionId },
        select: {
          monthlyFee: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
        },
      });
      if (sub) {
        const paidInPeriod = await tx.payment.aggregate({
          where: {
            subscriptionId: data.subscriptionId,
            paidAt: { gte: sub.currentPeriodStart, lte: sub.currentPeriodEnd },
          },
          _sum: { amountNet: true },
        });
        const totalPaid = Number(paidInPeriod._sum.amountNet ?? 0);
        const newStatus = deriveStatus({
          monthlyFee: Number(sub.monthlyFee),
          amountPaidInPeriod: totalPaid,
          periodEnd: sub.currentPeriodEnd,
        });
        await tx.subscription.update({
          where: { id: data.subscriptionId },
          data: { paymentStatus: newStatus },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "payment.log",
        entityType: "Payment",
        entityId: payment.id,
        changes: {
          revenueType: data.revenueType,
          gross: splitResult.grossAmount,
          net: splitResult.netAmount,
        },
      },
    });

    return { payment, splits: splitResult };
  });
}

export async function listPayments(filters: {
  revenueType?: string;
  from?: Date;
  to?: Date;
  payerUserId?: string;
} = {}) {
  return prisma.payment.findMany({
    where: {
      revenueType: filters.revenueType
        ? (filters.revenueType as
            | "SUBSCRIPTION"
            | "PRIVATE_SESSION"
            | "BELT_EXAM"
            | "CHAMPIONSHIP"
            | "MERCHANDISE")
        : undefined,
      payerUserId: filters.payerUserId,
      paidAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    orderBy: { paidAt: "desc" },
    include: {
      payerUser: { select: { fullNameEn: true } },
      splits: true,
      subscription: { select: { group: { select: { name: true } } } },
    },
    take: 200,
  });
}

export async function getPayment(id: string) {
  return prisma.payment.findUnique({
    where: { id },
    include: {
      splits: { include: { recipientUser: true, recipientLocation: true } },
      payerUser: true,
    },
  });
}

function numOrNull(d: { toNumber: () => number } | null | undefined): number | null {
  return d == null ? null : d.toNumber();
}
