"use server";

import { headers } from "next/headers";
import { auth } from "@/auth";
import { createPaymentIntent } from "@/application/payment-intents/service";
import { featureFlags } from "@/lib/feature-flags";
import { prisma } from "@/infrastructure/db/prisma";

async function appUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
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
    select: { id: true, traineeId: true, monthlyFee: true, paymentStatus: true },
  });
  if (!sub) return { error: "Subscription not found" };

  // Trainee may pay only their own subscription; staff may pay on behalf of any.
  const isOwner = sub.traineeId === session.user.id;
  const isStaff = session.user.role === "ADMIN" || session.user.role === "HEAD_COACH";
  if (!isOwner && !isStaff) return { error: "Forbidden" };

  if (sub.paymentStatus === "PAID") {
    return { error: "Subscription is already fully paid for the current period." };
  }

  try {
    const result = await createPaymentIntent(
      {
        revenueType: "SUBSCRIPTION",
        payerUserId: sub.traineeId,
        amount: Number(sub.monthlyFee),
        subscriptionId: sub.id,
        returnUrl: `${await appUrl()}/trainee/payments?intent_returned=1`,
      },
      session.user.id,
    );
    return { ok: true, redirectUrl: result.redirectUrl };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start payment" };
  }
}
