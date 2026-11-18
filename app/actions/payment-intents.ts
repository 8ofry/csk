"use server";

import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { createPaymentIntent } from "@/application/payment-intents/service";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/infrastructure/db/prisma";

function getConfiguredAppUrl(): string {
  return process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Trainee starts an online payment for one of their own subscriptions. */
export async function startSubscriptionPaymentAction(
  subscriptionId: string,
): Promise<{ ok?: true; redirectUrl?: string; error?: string }> {
  if (!featureFlags.onlinePayments()) {
    return { error: "Online payments are not enabled yet." };
  }

  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };

  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      traineeId: true,
      monthlyFee: true,
      discountPercent: true,
      paymentStatus: true,
    },
  });
  if (!sub) return { error: "Subscription not found" };

  // Trainee may pay only their own subscription; staff may pay on behalf of any.
  const isOwner = sub.traineeId === session.user.id;
  const isStaff = session.user.role === "ADMIN" || session.user.role === "HEAD_COACH";
  if (!isOwner && !isStaff) return { error: "Forbidden" };

  if (sub.paymentStatus === "PAID") {
    return { error: "Subscription is already fully paid for the current period." };
  }

  const discount = Number(sub.discountPercent ?? 0);
  const payableAmount = Math.max(0, Number(sub.monthlyFee) * (1 - discount / 100));
  const locale = await getLocale();

  try {
    const result = await createPaymentIntent(
      {
        revenueType: "SUBSCRIPTION",
        payerUserId: sub.traineeId,
        amount: Math.round(payableAmount * 100) / 100,
        subscriptionId: sub.id,
        returnUrl: `${getConfiguredAppUrl()}/${locale}/trainee/payments?intent_returned=1`,
      },
      session.user.id,
    );
    return { ok: true, redirectUrl: result.redirectUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment" };
  }
}
