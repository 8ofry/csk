"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import { requireRole } from "@/lib/auth-guard";
import {
  cancelPrivateSession,
  completePrivateSession,
  confirmPrivateSession,
  createPrivateSession,
  createPrivateSessionSchema,
} from "@/application/private-sessions/service";

export async function createPrivateSessionAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("TRAINEE");
    const traineeId =
      user.role === "TRAINEE" ? user.id : String(formData.get("traineeId") ?? "");
    const parsed = createPrivateSessionSchema.parse({
      traineeId,
      coachId: formData.get("coachId"),
      locationId: formData.get("locationId"),
      scheduledStart: formData.get("scheduledStart"),
      durationMins: formData.get("durationMins") || 60,
      fee: formData.get("fee"),
      notes: formData.get("notes") || undefined,
    });
    await createPrivateSession(parsed, user.id);
    revalidateLocalized("/coach/private-sessions");
    revalidateLocalized("/trainee/schedule");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create private session" };
  }
}

export async function confirmPrivateSessionAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await confirmPrivateSession(id, user.id, user.role);
    revalidateLocalized("/coach/private-sessions");
    revalidateLocalized("/trainee/schedule");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to confirm" };
  }
}

export async function completePrivateSessionAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await completePrivateSession(id, user.id, user.role);
    revalidateLocalized("/coach/private-sessions");
    revalidateLocalized("/trainee/schedule");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to complete" };
  }
}

export async function cancelPrivateSessionAction(
  id: string,
  reason?: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("TRAINEE");
    await cancelPrivateSession(id, user.id, user.role, reason);
    revalidateLocalized("/coach/private-sessions");
    revalidateLocalized("/trainee/schedule");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to cancel" };
  }
}
