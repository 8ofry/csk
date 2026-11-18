import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

export const coachEvalSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CoachEvalInput = z.infer<typeof coachEvalSchema>;

export async function upsertCoachEvaluation(input: CoachEvalInput, traineeId: string) {
  const data = coachEvalSchema.parse(input);

  const session = await prisma.session.findUnique({
    where: { id: data.sessionId },
    select: {
      id: true,
      coachId: true,
      status: true,
      attendances: {
        where: { traineeId },
        select: { status: true },
      },
    },
  });

  if (!session) throw new Error("Session not found");
  const att = session.attendances[0];
  if (!att || (att.status !== "PRESENT" && att.status !== "LATE")) {
    throw new Error("You can only evaluate sessions you attended");
  }

  const evalRow = await prisma.coachEvaluation.upsert({
    where: {
      sessionId_traineeId: {
        sessionId: data.sessionId,
        traineeId,
      },
    },
    update: {
      rating: data.rating,
      comment: data.comment?.trim() || null,
    },
    create: {
      sessionId: data.sessionId,
      coachId: session.coachId,
      traineeId,
      rating: data.rating,
      comment: data.comment?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: traineeId,
      action: "coach_evaluation.upsert",
      entityType: "CoachEvaluation",
      entityId: evalRow.id,
      changes: { sessionId: data.sessionId, rating: data.rating },
    },
  });

  return evalRow;
}

export async function listTraineeCoachEvaluations(traineeId: string) {
  return prisma.coachEvaluation.findMany({
    where: { traineeId },
    include: {
      coach: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      session: {
        select: {
          id: true,
          scheduledStart: true,
          group: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listCoachEvaluationSummary(coachId: string) {
  const rows = await prisma.coachEvaluation.findMany({
    where: { coachId },
    select: { rating: true, comment: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const count = rows.length;
  const average =
    count > 0 ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / count) * 100) / 100 : 0;
  return { count, average, recent: rows };
}
