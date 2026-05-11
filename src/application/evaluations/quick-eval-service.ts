// Quick per-session evaluation (FR-EVAL-01).
// Designed to be completable in <1 minute per trainee.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

export const quickEvalSchema = z.object({
  sessionId: z.string().min(1),
  traineeId: z.string().min(1),
  effortScore: z.coerce.number().int().min(1).max(10),
  notes: z.string().max(280).optional(),
  flaggedBodyPart: z.string().max(40).optional(),
  flaggedSkill: z.string().max(40).optional(),
});

export type QuickEvalInput = z.infer<typeof quickEvalSchema>;

export async function upsertQuickEvaluation(input: QuickEvalInput, actorId: string) {
  const data = quickEvalSchema.parse(input);
  const upserted = await prisma.quickEvaluation.upsert({
    where: { sessionId_traineeId: { sessionId: data.sessionId, traineeId: data.traineeId } },
    create: {
      sessionId: data.sessionId,
      traineeId: data.traineeId,
      effortScore: data.effortScore,
      notes: data.notes ?? null,
      flaggedBodyPart: data.flaggedBodyPart ?? null,
      flaggedSkill: data.flaggedSkill ?? null,
      createdById: actorId,
    },
    update: {
      effortScore: data.effortScore,
      notes: data.notes ?? null,
      flaggedBodyPart: data.flaggedBodyPart ?? null,
      flaggedSkill: data.flaggedSkill ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "quick-eval.upsert",
      entityType: "QuickEvaluation",
      entityId: upserted.id,
    },
  });
  return upserted;
}
