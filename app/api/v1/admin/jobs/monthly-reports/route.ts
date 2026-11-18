import { runMonthlyReportBatch } from "@/application/monthly-reports/service";
import { jsonResponse } from "@/lib/api";
import { requireAdminOrCron } from "@/lib/cron-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrCron(req);
  if (denied) return denied;
  const report = await runMonthlyReportBatch();
  return jsonResponse({ ok: true, ...report });
}
