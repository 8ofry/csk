// GET /api/v1/me/subscriptions

import { listSubscriptionsForTrainee } from "@/application/subscriptions/service";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;
  const subs = await listSubscriptionsForTrainee(auth.user.id);
  return jsonResponse({
    subscriptions: subs.map((s) => ({
      id: s.id,
      group: s.group,
      location: s.location,
      discipline: s.discipline,
      monthlyFee: Number(s.monthlyFee),
      sessionsPerMonth: s.sessionsPerMonth,
      currentPeriodStart: s.currentPeriodStart,
      currentPeriodEnd: s.currentPeriodEnd,
      paymentStatus: s.paymentStatus,
      active: s.active,
    })),
  });
}
