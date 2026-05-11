// Admin manual trigger for the daily medical expiry alert pass.
// Useful for serverless deployments where you wire an external scheduler
// (Vercel Cron, GitHub Actions schedule, cron-job.org, etc.) to POST here daily.
//
// In self-hosted deployments, run `npm run worker` instead — it uses pg-boss
// to schedule the same function locally.

import { auth } from "@/auth";
import { runDailyAlerts } from "@/application/medical/expiry-alerts";
import { jsonError, jsonResponse } from "@/lib/api";

export async function POST(req: Request) {
  // Two paths: signed-in admin OR a shared secret in the Authorization header
  // (set CRON_SECRET in env and pass `Authorization: Bearer <secret>`).
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    const cronSecret = process.env.CRON_SECRET;
    const auth = req.headers.get("authorization") ?? "";
    if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
      return jsonError("Forbidden", 403);
    }
  }

  const report = await runDailyAlerts();
  return jsonResponse({ ok: true, ...report });
}
