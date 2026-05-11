// GET /api/v1/coach/sessions/:id — session detail for the authed coach.

import { getSessionForCoach } from "@/application/sessions/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonError, jsonResponse } from "@/lib/api";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const session = await getSessionForCoach(id, auth.user.id);
  if (!session) return jsonError("Not found", 404);
  return jsonResponse({ session });
}
