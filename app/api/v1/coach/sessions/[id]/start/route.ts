// POST /api/v1/coach/sessions/start — materialize a Session for a (group, scheduledStart).
// Body: { groupId, scheduledStart (ISO) } — the path id is unused; we accept
// either the path-id route OR a body-driven call so the mobile app can use
// occurrence start-times directly.

import { z } from "zod";
import { startSession } from "@/application/sessions/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonError, jsonResponse } from "@/lib/api";

const inputSchema = z.object({
  groupId: z.string().min(1),
  scheduledStart: z.string().datetime(),
});

export async function POST(req: Request) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");

  try {
    const session = await startSession({
      coachId: auth.user.id,
      groupId: parsed.data.groupId,
      scheduledStart: new Date(parsed.data.scheduledStart),
    });
    return jsonResponse({ session });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not start session");
  }
}
