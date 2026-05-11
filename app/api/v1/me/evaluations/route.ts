// GET /api/v1/me/evaluations — recent quick + detailed evals.

import { prisma } from "@/infrastructure/db/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const [quick, detailed] = await Promise.all([
    prisma.quickEvaluation.findMany({
      where: { traineeId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        sessionId: true,
        effortScore: true,
        notes: true,
        flaggedBodyPart: true,
        flaggedSkill: true,
        createdAt: true,
      },
    }),
    prisma.detailedEvaluation.findMany({
      where: { traineeId: auth.user.id },
      orderBy: { evaluationDate: "desc" },
      take: 6,
      select: {
        id: true,
        evaluationDate: true,
        period: true,
        bodyPartScores: true,
        skillScores: true,
        summaryComment: true,
      },
    }),
  ]);

  return jsonResponse({ quick, detailed });
}
