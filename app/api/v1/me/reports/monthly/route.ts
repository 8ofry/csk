// GET /api/v1/me/reports/monthly — list (sanitized) of monthly performance
// reports. The PDF is fetched separately via /api/v1/files/monthly-report/<id>.pdf.

import { prisma } from "@/infrastructure/db/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const reports = await prisma.monthlyReport.findMany({
    where: { traineeId: auth.user.id, status: { in: ["APPROVED", "DELIVERED"] } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    select: {
      id: true,
      periodYear: true,
      periodMonth: true,
      status: true,
      generatedAt: true,
      approvedAt: true,
      deliveredAt: true,
      pdfUrl: true,
      attendanceSummary: true,
      milestones: true,
    },
  });

  return jsonResponse({ reports });
}
