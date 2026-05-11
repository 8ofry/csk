// GET /api/v1/coach/earnings?from=&to= — same data the dashboard uses.

import { coachEarnings } from "@/application/financial/dashboards";
import { requireApiRole } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const now = new Date();
  const from = url.searchParams.get("from")
    ? new Date(url.searchParams.get("from")!)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const to = url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : now;

  const result = await coachEarnings(auth.user.id, { from, to });
  return jsonResponse({ from: from.toISOString(), to: to.toISOString(), ...result });
}
