// Detailed body-map evaluation (FR-EVAL-02..05).
// Cadence: weekly or monthly. Body parts + technical skills, each with score 1-10 + comment.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { TARGET_BODY_PARTS } from "@/application/training-units/schemas";

export const partScoreSchema = z.object({
  score: z.coerce.number().int().min(1).max(10),
  comment: z.string().max(500).optional(),
});

const bodyPartKeys = z.enum(TARGET_BODY_PARTS);

export const detailedEvalSchema = z.object({
  traineeId: z.string().min(1),
  contextGroupId: z.string().nullable().optional(),
  evaluationDate: z.coerce.date().default(() => new Date()),
  period: z.enum(["WEEKLY", "MONTHLY"]),
  /** Map of body-part key → { score, comment } */
  bodyPartScores: z.record(bodyPartKeys, partScoreSchema),
  /** Map of skill key (free-form, drawn from discipline taxonomy) → { score, comment } */
  skillScores: z.record(z.string().min(1), partScoreSchema),
  summaryComment: z.string().max(2000).optional(),
});

export type DetailedEvalInput = z.infer<typeof detailedEvalSchema>;

export async function createDetailedEvaluation(input: DetailedEvalInput, evaluatorId: string) {
  const data = detailedEvalSchema.parse(input);
  const created = await prisma.detailedEvaluation.create({
    data: {
      traineeId: data.traineeId,
      evaluatorId,
      contextGroupId: data.contextGroupId ?? null,
      evaluationDate: data.evaluationDate,
      period: data.period,
      bodyPartScores: data.bodyPartScores,
      skillScores: data.skillScores,
      summaryComment: data.summaryComment ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: evaluatorId,
      action: "detailed-eval.create",
      entityType: "DetailedEvaluation",
      entityId: created.id,
      changes: { period: data.period, traineeId: data.traineeId },
    },
  });
  return created;
}

export async function listDetailedEvaluationsForTrainee(traineeId: string, take = 12) {
  return prisma.detailedEvaluation.findMany({
    where: { traineeId },
    orderBy: { evaluationDate: "desc" },
    take,
    include: { evaluator: { select: { fullNameEn: true, fullNameAr: true } } },
  });
}

export async function latestDetailedEvaluation(traineeId: string) {
  return prisma.detailedEvaluation.findFirst({
    where: { traineeId },
    orderBy: { evaluationDate: "desc" },
  });
}
