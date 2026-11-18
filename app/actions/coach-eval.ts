"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import { requireRole } from "@/lib/auth-guard";
import {
  coachEvalSchema,
  upsertCoachEvaluation,
} from "@/application/evaluations/coach-eval-service";

export async function submitCoachEvaluationAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("TRAINEE");
    const parsed = coachEvalSchema.parse({
      sessionId: formData.get("sessionId"),
      rating: formData.get("rating"),
      comment: formData.get("comment") || undefined,
    });
    await upsertCoachEvaluation(parsed, user.id);
    revalidateLocalized("/trainee/evaluations");
    revalidateLocalized("/trainee");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to submit evaluation" };
  }
}
