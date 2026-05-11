// Belt exams (FR-BLT-01..05).
// "Current level" for a (trainee, discipline) is derived from the most recent
// passed BeltExamResult — keeps the data model simple and history-true.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import {
  resolvePassedLevel,
  type LevelBand,
} from "@/domain/belts/progression";
import { dispatchNotification } from "@/application/notifications/service";

export const beltExamInputSchema = z.object({
  disciplineId: z.string().min(1),
  examDate: z.coerce.date(),
  locationLabel: z.string().min(1),
  examinerName: z.string().min(1),
  federation: z.string().min(1),
  fee: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export type BeltExamInput = z.infer<typeof beltExamInputSchema>;

export const beltResultInputSchema = z.object({
  examId: z.string().min(1),
  traineeId: z.string().min(1),
  result: z.enum(["PASSED", "FAILED"]),
  score: z.coerce.number().min(0).max(100).optional().nullable(),
  /** Optional — if missing on PASSED, server uses next level above current. */
  newLevel: z.enum(["N", "A", "B", "C"]).optional().nullable(),
});

export type BeltResultInput = z.infer<typeof beltResultInputSchema>;

export async function createBeltExam(input: BeltExamInput, actorId: string) {
  const data = beltExamInputSchema.parse(input);
  const created = await prisma.beltExam.create({
    data: {
      disciplineId: data.disciplineId,
      examDate: data.examDate,
      locationLabel: data.locationLabel,
      examinerName: data.examinerName,
      federation: data.federation,
      fee: data.fee,
      notes: data.notes ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "belt-exam.create",
      entityType: "BeltExam",
      entityId: created.id,
    },
  });
  return created;
}

export async function listBeltExams() {
  return prisma.beltExam.findMany({
    orderBy: { examDate: "desc" },
    include: {
      discipline: { select: { nameEn: true } },
      _count: { select: { results: true } },
    },
  });
}

export async function getBeltExam(id: string) {
  return prisma.beltExam.findUnique({
    where: { id },
    include: {
      discipline: true,
      results: {
        include: { trainee: { select: { id: true, fullNameEn: true, fullNameAr: true } } },
        orderBy: { recordedAt: "asc" },
      },
    },
  });
}

export async function listExamsForTrainee(traineeId: string) {
  return prisma.beltExamResult.findMany({
    where: { traineeId },
    orderBy: { recordedAt: "desc" },
    include: {
      exam: { include: { discipline: { select: { nameEn: true } } } },
    },
  });
}

/** Current level for (trainee, discipline) derived from most-recent PASSED result. */
export async function currentLevelFor(
  traineeId: string,
  disciplineId: string,
): Promise<LevelBand | null> {
  const latest = await prisma.beltExamResult.findFirst({
    where: { traineeId, result: "PASSED", exam: { disciplineId } },
    orderBy: { recordedAt: "desc" },
    select: { newLevel: true },
  });
  return (latest?.newLevel ?? null) as LevelBand | null;
}

export async function recordBeltResult(input: BeltResultInput, actorId: string) {
  const data = beltResultInputSchema.parse(input);

  const exam = await prisma.beltExam.findUnique({
    where: { id: data.examId },
    select: { id: true, disciplineId: true },
  });
  if (!exam) throw new Error("Exam not found");

  let newLevel: LevelBand | null = null;
  if (data.result === "PASSED") {
    const current = await currentLevelFor(data.traineeId, exam.disciplineId);
    newLevel = resolvePassedLevel(current, data.newLevel ?? undefined);
  }

  const upserted = await prisma.beltExamResult.upsert({
    where: { examId_traineeId: { examId: data.examId, traineeId: data.traineeId } },
    create: {
      examId: data.examId,
      traineeId: data.traineeId,
      result: data.result,
      score: data.score ?? null,
      newLevel,
      recordedById: actorId,
    },
    update: {
      result: data.result,
      score: data.score ?? null,
      newLevel,
      recordedById: actorId,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "belt-exam.record-result",
      entityType: "BeltExamResult",
      entityId: upserted.id,
      changes: { result: data.result, newLevel },
    },
  });

  if (data.result === "PASSED" && newLevel) {
    await dispatchNotification({
      recipientUserId: data.traineeId,
      eventType: "BELT_EXAM_SCHEDULED", // generic belt event for now; v2 add BELT_PROMOTED
      payload: { decision: `passed → ${newLevel}` },
    });
  }

  return upserted;
}
