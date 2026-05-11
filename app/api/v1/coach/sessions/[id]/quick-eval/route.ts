// POST /api/v1/coach/sessions/:id/quick-eval
// Body: { traineeId, effortScore, notes?, flaggedBodyPart?, flaggedSkill? }

import {
  quickEvalSchema,
  upsertQuickEvaluation,
} from "@/application/evaluations/quick-eval-service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonError, jsonResponse } from "@/lib/api";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;
  const { id: sessionId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = quickEvalSchema.safeParse({ ...(body as object), sessionId });
  if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    const upserted = await upsertQuickEvaluation(parsed.data, auth.user.id);
    return jsonResponse({ id: upserted.id, ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to save quick eval");
  }
}
