// GET /api/v1/me/championships — own registrations + career fight record.

import { prisma } from "@/infrastructure/db/prisma";
import { careerRecordForTrainee, listOpenForTrainee } from "@/application/championships/service";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const [open, mine, record] = await Promise.all([
    listOpenForTrainee(auth.user.id),
    prisma.championshipRegistration.findMany({
      where: { traineeId: auth.user.id },
      orderBy: { createdAt: "desc" },
      include: { championship: true, fightResults: true },
    }),
    careerRecordForTrainee(auth.user.id),
  ]);

  return jsonResponse({ open, mine, record });
}
