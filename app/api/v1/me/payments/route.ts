// GET /api/v1/me/payments — payment history for the authed user.

import { prisma } from "@/infrastructure/db/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const take = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const payments = await prisma.payment.findMany({
    where: { payerUserId: auth.user.id },
    orderBy: { paidAt: "desc" },
    take,
    select: {
      id: true,
      revenueType: true,
      amountGross: true,
      amountNet: true,
      currency: true,
      method: true,
      receiptNumber: true,
      paidAt: true,
      notes: true,
    },
  });

  return jsonResponse({
    payments: payments.map((p) => ({
      ...p,
      amountGross: Number(p.amountGross),
      amountNet: Number(p.amountNet),
    })),
  });
}
