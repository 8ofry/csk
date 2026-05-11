"use server";

import { revalidatePath } from "next/cache";
import { startSession, endSession } from "@/application/sessions/service";
import {
  bulkMarkAttendance,
  attendanceStatusSchema,
  type AttendanceMark,
} from "@/application/attendance/service";
import {
  upsertQuickEvaluation,
  quickEvalSchema,
} from "@/application/evaluations/quick-eval-service";
import { requireRole } from "@/lib/auth-guard";

export async function startSessionAction(input: {
  groupId: string;
  scheduledStart: string;
}): Promise<{ ok?: true; sessionId?: string; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const session = await startSession({
      coachId: user.id,
      groupId: input.groupId,
      scheduledStart: new Date(input.scheduledStart),
    });
    revalidatePath("/coach/today");
    return { ok: true, sessionId: session.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function endSessionAction(
  sessionId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await endSession({ coachId: user.id, sessionId });
    revalidatePath("/coach/today");
    revalidatePath(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function bulkMarkAttendanceAction(
  sessionId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const marks: { traineeId: string; status: AttendanceMark }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("status:")) continue;
      const traineeId = key.slice("status:".length);
      const parsed = attendanceStatusSchema.safeParse(String(value));
      if (parsed.success) marks.push({ traineeId, status: parsed.data });
    }
    await bulkMarkAttendance({
      sessionId,
      marks,
      actorId: user.id,
      actorRole: user.role === "ADMIN" || user.role === "HEAD_COACH" ? user.role : "COACH",
    });
    revalidatePath(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function upsertQuickEvalAction(
  sessionId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const parsed = quickEvalSchema.parse({
      sessionId,
      traineeId: formData.get("traineeId"),
      effortScore: formData.get("effortScore"),
      notes: formData.get("notes") || undefined,
      flaggedBodyPart: formData.get("flaggedBodyPart") || undefined,
      flaggedSkill: formData.get("flaggedSkill") || undefined,
    });
    await upsertQuickEvaluation(parsed, user.id);
    revalidatePath(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
