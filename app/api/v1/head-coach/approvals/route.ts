// GET /api/v1/head-coach/approvals — combined approvals queue.

import { listPendingApproval } from "@/application/session-plans/service";
import {
  listOverdueDailyReports,
  listPendingDailyReports,
} from "@/application/daily-reports/service";
import { listPending as listPendingUsers } from "@/application/users/service";
import { requireApiRole } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiRole(req, "HEAD_COACH");
  if ("response" in auth) return auth.response;

  const [sessionPlans, dailyReports, overdueReports, pendingUsers] = await Promise.all([
    listPendingApproval(),
    listPendingDailyReports(),
    listOverdueDailyReports(),
    listPendingUsers(),
  ]);
  const overdueIds = new Set(overdueReports.map((r) => r.id));
  return jsonResponse({
    sessionPlans,
    dailyReports: dailyReports.map((r) => ({ ...r, overdue: overdueIds.has(r.id) })),
    pendingUsers,
    counts: {
      sessionPlans: sessionPlans.length,
      dailyReports: dailyReports.length,
      overdueDailyReports: overdueReports.length,
      pendingUsers: pendingUsers.length,
    },
  });
}
