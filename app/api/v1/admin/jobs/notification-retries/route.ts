import { runNotificationRetries } from "@/application/notifications/retry-job";
import { jsonResponse } from "@/lib/api";
import { requireAdminOrCron } from "@/lib/cron-auth";

export async function POST(req: Request) {
  const denied = await requireAdminOrCron(req);
  if (denied) return denied;
  const report = await runNotificationRetries();
  return jsonResponse({ ok: true, ...report });
}
