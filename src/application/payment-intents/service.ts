// PaymentIntent service — orchestrates the gateway flow:
//   create → adapter.initiate → handoff URL → (user pays) → webhook → settle
// Settling calls the existing logPayment() so a real Payment + RevenueSplit
// rows are persisted with the same split-engine guarantees as cash payments.

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { paymentAdapter } from "@/infrastructure/payments/factory";
import { logPayment } from "@/application/payments/service";
import { logger } from "@/infrastructure/observability/logger";

export const createIntentSchema = z.object({
  revenueType: z.enum(["SUBSCRIPTION", "PRIVATE_SESSION", "BELT_EXAM", "CHAMPIONSHIP", "MERCHANDISE"]),
  payerUserId: z.string().min(1),
  amount: z.coerce.number().min(0.01),
  // Same FK fan-out as Payment so the webhook can settle correctly.
  subscriptionId: z.string().optional(),
  privateSessionId: z.string().optional(),
  championshipRegId: z.string().optional(),
  beltExamResultId: z.string().optional(),
  merchandiseSaleId: z.string().optional(),
  locationId: z.string().optional(),
  coachUserId: z.string().optional(),
  disciplineId: z.string().optional(),
  returnUrl: z.string().url(),
});

export type CreateIntentInput = z.infer<typeof createIntentSchema>;

export class PaymentIntentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentIntentError";
  }
}

export async function createPaymentIntent(input: CreateIntentInput, actorId: string) {
  const data = createIntentSchema.parse(input);

  // Resolve payer details for the gateway billing fields.
  const payer = await prisma.user.findUnique({
    where: { id: data.payerUserId },
    select: { fullNameEn: true, email: true, phone: true },
  });
  if (!payer) throw new PaymentIntentError("Payer not found");
  if (!payer.phone) throw new PaymentIntentError("Payer phone is required for online payment");

  const adapter = paymentAdapter();

  const intent = await prisma.paymentIntent.create({
    data: {
      revenueType: data.revenueType,
      payerUserId: data.payerUserId,
      amount: new Prisma.Decimal(data.amount),
      currency: "EGP",
      status: "PENDING",
      provider: adapter.provider,
      subscriptionId: data.subscriptionId,
      privateSessionId: data.privateSessionId,
      championshipRegId: data.championshipRegId,
      beltExamResultId: data.beltExamResultId,
      merchandiseSaleId: data.merchandiseSaleId,
      locationId: data.locationId,
      coachUserId: data.coachUserId,
      disciplineId: data.disciplineId,
      createdById: actorId,
    },
  });

  let initResult;
  try {
    initResult = await adapter.initiate({
      intentId: intent.id,
      amount: data.amount,
      currency: "EGP",
      payer: {
        fullName: payer.fullNameEn,
        email: payer.email,
        phone: payer.phone,
      },
      description: `CSK ${data.revenueType.toLowerCase()} payment`,
      returnUrl: data.returnUrl,
    });
  } catch (err) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        status: "FAILED",
        providerData: { error: err instanceof Error ? err.message : String(err) },
      },
    });
    throw err;
  }

  await prisma.paymentIntent.update({
    where: { id: intent.id },
    data: {
      status: "PROCESSING",
      providerOrderId: initResult.providerOrderId,
      providerData: (initResult.raw ?? {}) as Prisma.InputJsonValue,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "payment-intent.create",
      entityType: "PaymentIntent",
      entityId: intent.id,
      changes: { provider: adapter.provider, amount: data.amount },
    },
  });

  return {
    intentId: intent.id,
    redirectUrl: initResult.redirectUrl,
    provider: adapter.provider,
  };
}

/**
 * Called from the gateway webhook handler after signature verification.
 * Idempotent: if the intent is already SUCCEEDED, returns the existing payment.
 */
export async function settlePaymentIntent(
  intentId: string,
  verified: { outcome: "SUCCESS" | "FAILED" | "PENDING" | "UNKNOWN"; raw: unknown },
) {
  const intent = await prisma.paymentIntent.findUnique({
    where: { id: intentId },
    include: { payment: true },
  });
  if (!intent) throw new PaymentIntentError("Intent not found");
  if (intent.status === "SUCCEEDED") return { status: "SUCCEEDED" as const, paymentId: intent.paymentId };

  if (verified.outcome !== "SUCCESS") {
    await prisma.paymentIntent.update({
      where: { id: intentId },
      data: {
        status: verified.outcome === "FAILED" ? "FAILED" : "PROCESSING",
        providerData: appendRaw(intent.providerData, verified.raw),
      },
    });
    logger.warn("Payment intent did not succeed", {
      tags: { intentId, outcome: verified.outcome },
    });
    return { status: verified.outcome === "FAILED" ? ("FAILED" as const) : ("PROCESSING" as const) };
  }

  // Persist the real Payment + splits via the existing engine.
  const result = await logPayment(
    {
      revenueType: intent.revenueType,
      payerUserId: intent.payerUserId,
      amountGross: Number(intent.amount),
      method: "ONLINE",
      subscriptionId: intent.subscriptionId ?? undefined,
      privateSessionId: intent.privateSessionId ?? undefined,
      championshipRegistrationId: intent.championshipRegId ?? undefined,
      beltExamResultId: intent.beltExamResultId ?? undefined,
      merchandiseSaleId: intent.merchandiseSaleId ?? undefined,
      locationId: intent.locationId ?? undefined,
      coachUserId: intent.coachUserId ?? undefined,
      disciplineId: intent.disciplineId ?? undefined,
      notes: `Online payment via ${intent.provider}`,
    },
    intent.createdById,
  );

  await prisma.paymentIntent.update({
    where: { id: intentId },
    data: {
      status: "SUCCEEDED",
      paymentId: result.payment.id,
      providerData: appendRaw(intent.providerData, verified.raw),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: intent.createdById,
      action: "payment-intent.settle",
      entityType: "PaymentIntent",
      entityId: intentId,
      changes: { paymentId: result.payment.id, receipt: result.payment.receiptNumber },
    },
  });

  return { status: "SUCCEEDED" as const, paymentId: result.payment.id };
}

function appendRaw(existing: Prisma.JsonValue | null, addition: unknown): Prisma.InputJsonValue {
  const list = Array.isArray(existing) ? existing : existing ? [existing] : [];
  return [...list, addition] as Prisma.InputJsonValue;
}
