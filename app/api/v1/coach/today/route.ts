// GET /api/v1/coach/today — derived occurrences for the current day,
// merged with materialized Session rows so the mobile app knows whether to
// "Start session" or "Open session".

import { listScheduledForCoach } from "@/application/sessions/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiRole(req, "COACH");
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const day = dateParam ? new Date(dateParam) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);

  const occurrences = await listScheduledForCoach(auth.user.id, start, end);
  return jsonResponse({ date: day.toISOString().slice(0, 10), occurrences });
}
