"use server";

import { revalidatePath } from "next/cache";
import { logPayment, logPaymentSchema } from "@/application/payments/service";
import { requireRole } from "@/lib/auth-guard";

export async function logSubscriptionPaymentAction(
  formData: FormData,
): Promise<{ ok?: true; paymentId?: string; receiptNumber?: string; error?: string }> {
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
    revalidatePath("/admin/financial");
    revalidatePath("/admin/financial/payments");
    revalidatePath(`/trainee/payments`);
    return {
      ok: true,
      paymentId: result.payment.id,
      receiptNumber: result.payment.receiptNumber,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
