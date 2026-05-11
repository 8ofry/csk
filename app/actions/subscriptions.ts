"use server";

import { revalidatePath } from "next/cache";
import {
  archiveSubscription,
  createSubscription,
  subscriptionInputSchema,
} from "@/application/subscriptions/service";
import { requireRole } from "@/lib/auth-guard";

export async function createSubscriptionAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = subscriptionInputSchema.parse({
      traineeId: formData.get("traineeId"),
      groupId: formData.get("groupId"),
      monthlyFee: formData.get("monthlyFee"),
      sessionsPerMonth: formData.get("sessionsPerMonth") ?? 12,
      discountPercent: formData.get("discountPercent") || null,
      discountReason: formData.get("discountReason") || null,
      startMonth: formData.get("startMonth"),
    });
    const created = await createSubscription(data, user.id);
    revalidatePath("/head-coach/subscriptions");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function archiveSubscriptionAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await archiveSubscription(id, user.id);
    revalidatePath("/head-coach/subscriptions");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
