"use server";

import { revalidatePath } from "next/cache";
import {
  createDetailedEvaluation,
  detailedEvalSchema,
} from "@/application/evaluations/detailed-eval-service";
import { requireRole } from "@/lib/auth-guard";

export async function createDetailedEvalAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const traineeId = String(formData.get("traineeId") ?? "");
    const contextGroupId = String(formData.get("contextGroupId") ?? "") || null;
    const period = String(formData.get("period") ?? "WEEKLY");
    const summaryComment = String(formData.get("summaryComment") ?? "") || undefined;

    const bodyPartScores = parseScoreMap(formData, "body:");
    const skillScores = parseScoreMap(formData, "skill:");

    const data = detailedEvalSchema.parse({
      traineeId,
      contextGroupId,
      evaluationDate: new Date(),
      period,
      bodyPartScores,
      skillScores,
      summaryComment,
    });

    const created = await createDetailedEvaluation(data, user.id);
    revalidatePath(`/coach/trainees/${traineeId}`);
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function parseScoreMap(
  fd: FormData,
  prefix: "body:" | "skill:",
): Record<string, { score: number; comment?: string }> {
  const out: Record<string, { score: number; comment?: string }> = {};
  for (const [key, value] of fd.entries()) {
    if (!key.startsWith(`${prefix}score:`)) continue;
    const id = key.slice(`${prefix}score:`.length);
    const score = Number(value);
    if (!Number.isFinite(score) || score < 1 || score > 10) continue;
    const comment = String(fd.get(`${prefix}comment:${id}`) ?? "") || undefined;
    out[id] = { score, comment };
  }
  return out;
}
