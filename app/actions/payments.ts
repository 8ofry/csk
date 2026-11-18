"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import { logPayment, logPaymentSchema, refundPayment } from "@/application/payments/service";
import { requireRole } from "@/lib/auth-guard";

export async function logSubscriptionPaymentAction(
  formData: FormData,
): Promise<{ ok?: true; paymentId?: string; receiptNumber?: string; subscriptionStatus?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = logPaymentSchema.parse({
      revenueType: "SUBSCRIPTION",
      payerUserId: formData.get("payerUserId"),
      amountGross: formData.get("amountGross"),
      method: formData.get("method"),
      subscriptionId: formData.get("subscriptionId"),
      notes: formData.get("notes") || undefined,
    });
    const result = await logPayment(data, user.id);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/payments");
    revalidateLocalized(`/trainee/payments`);
    return {
      ok: true,
      paymentId: result.payment.id,
      receiptNumber: result.payment.receiptNumber,
      subscriptionStatus: result.subscriptionStatus,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function refundPaymentAction(
  paymentId: string,
  reason?: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("ADMIN");
    await refundPayment(paymentId, user.id, reason);
    revalidateLocalized("/admin/financial");
    revalidateLocalized("/admin/financial/payments");
    revalidateLocalized("/trainee/payments");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to refund payment" };
  }
}
