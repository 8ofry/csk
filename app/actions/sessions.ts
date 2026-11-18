"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import {
  startSession,
  endSession,
  updateExecutedSequence,
  type ExecutedSequenceUnit,
} from "@/application/sessions/service";
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
    revalidateLocalized("/coach/today");
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
    revalidateLocalized("/coach/today");
    revalidateLocalized(`/coach/sessions/${sessionId}`);
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
    revalidateLocalized(`/coach/sessions/${sessionId}`);
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
    revalidateLocalized(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateExecutedSequenceAction(
  sessionId: string,
  executedSequence: ExecutedSequenceUnit[],
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await updateExecutedSequence({
      sessionId,
      coachId: user.id,
      executedSequence,
    });
    revalidateLocalized(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function markAllPresentAction(
  sessionId: string,
  traineeIds: string[],
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await bulkMarkAttendance({
      sessionId,
      marks: traineeIds.map((traineeId) => ({ traineeId, status: "PRESENT" })),
      actorId: user.id,
      actorRole: user.role === "ADMIN" || user.role === "HEAD_COACH" ? user.role : "COACH",
    });
    revalidateLocalized(`/coach/sessions/${sessionId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
