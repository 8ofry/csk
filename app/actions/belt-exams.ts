"use server";

import { revalidatePath } from "next/cache";
import {
  beltExamInputSchema,
  beltResultInputSchema,
  createBeltExam,
  recordBeltResult,
} from "@/application/belt-exams/service";
import { requireRole } from "@/lib/auth-guard";

/** Void-returning wrapper, used as a server `<form action>` (result-objects aren't supported there). */
export async function createBeltExamFormAction(formData: FormData): Promise<void> {
  await createBeltExamAction(formData);
}

export async function createBeltExamAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = beltExamInputSchema.parse({
      disciplineId: formData.get("disciplineId"),
      examDate: formData.get("examDate"),
      locationLabel: formData.get("locationLabel"),
      examinerName: formData.get("examinerName"),
      federation: formData.get("federation"),
      fee: formData.get("fee"),
      notes: formData.get("notes") || null,
    });
    const created = await createBeltExam(data, user.id);
    revalidatePath("/head-coach/belt-exams");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function recordBeltResultAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = beltResultInputSchema.parse({
      examId: formData.get("examId"),
      traineeId: formData.get("traineeId"),
      result: formData.get("result"),
      score: formData.get("score") || null,
      newLevel: formData.get("newLevel") || null,
    });
    await recordBeltResult(data, user.id);
    revalidatePath(`/head-coach/belt-exams/${data.examId}`);
    revalidatePath("/head-coach/belt-exams");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
