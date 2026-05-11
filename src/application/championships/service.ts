// Championships (FR-CH-01..07).
// Workflow: HC creates → Trainee opts in → Coach confirms → Trainee pays
// (medical clearance gate at confirmation per FR-CH-04) → Coach records result.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { isTraineeCleared } from "@/application/medical/service";
import { aggregateFightRecord, type FightRow } from "@/domain/championships/fight-record";
import { dispatchNotification } from "@/application/notifications/service";

export const championshipInputSchema = z.object({
  name: z.string().min(2),
  organizer: z.string().min(2),
  isOfficial: z.boolean().default(true),
  locationLabel: z.string().min(2),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  disciplineIds: z.array(z.string()).min(1),
  weightCategories: z.array(z.string()).default([]),
  ageCategories: z.array(z.string()).default([]),
  allowedLevels: z.array(z.enum(["N", "A", "B", "C"])).min(1),
  registrationDeadline: z.coerce.date(),
  registrationFee: z.coerce.number().min(0),
  notes: z.string().optional().nullable(),
});

export type ChampionshipInput = z.infer<typeof championshipInputSchema>;

export class ChampionshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChampionshipError";
  }
}

export async function createChampionship(input: ChampionshipInput, actorId: string) {
  const data = championshipInputSchema.parse(input);
  const created = await prisma.championship.create({
    data: {
      name: data.name,
      organizer: data.organizer,
      isOfficial: data.isOfficial,
      locationLabel: data.locationLabel,
      startDate: data.startDate,
      endDate: data.endDate,
      disciplines: data.disciplineIds,
      weightCategories: data.weightCategories,
      ageCategories: data.ageCategories,
      allowedLevels: data.allowedLevels,
      registrationDeadline: data.registrationDeadline,
      registrationFee: data.registrationFee,
      notes: data.notes ?? null,
      createdById: actorId,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.create",
      entityType: "Championship",
      entityId: created.id,
    },
  });
  return created;
}

export async function listChampionships() {
  return prisma.championship.findMany({
    orderBy: { startDate: "asc" },
    include: { _count: { select: { registrations: true } } },
  });
}

export async function listOpenForTrainee(traineeId: string) {
  const now = new Date();
  return prisma.championship.findMany({
    where: {
      registrationDeadline: { gte: now },
      registrations: { none: { traineeId } },
    },
    orderBy: { startDate: "asc" },
  });
}

export async function getChampionship(id: string) {
  return prisma.championship.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          trainee: { select: { id: true, fullNameEn: true, fullNameAr: true } },
          fightResults: true,
        },
      },
    },
  });
}

export async function optInTrainee(opts: {
  championshipId: string;
  traineeId: string;
  weightKg?: number | null;
  level?: "N" | "A" | "B" | "C" | null;
  targetWeightClass?: string | null;
  weightCutNotes?: string | null;
  isAmateur?: boolean;
  actorId: string;
}) {
  const { championshipId, traineeId, actorId } = opts;
  const championship = await prisma.championship.findUnique({
    where: { id: championshipId },
    select: { registrationDeadline: true, allowedLevels: true },
  });
  if (!championship) throw new ChampionshipError("Championship not found");
  if (championship.registrationDeadline < new Date()) {
    throw new ChampionshipError("Registration deadline has passed");
  }
  if (opts.level && !championship.allowedLevels.includes(opts.level)) {
    throw new ChampionshipError(`Level ${opts.level} not allowed for this championship`);
  }

  const reg = await prisma.championshipRegistration.upsert({
    where: { championshipId_traineeId: { championshipId, traineeId } },
    create: {
      championshipId,
      traineeId,
      weightKg: opts.weightKg ?? null,
      level: opts.level ?? null,
      targetWeightClass: opts.targetWeightClass ?? null,
      weightCutNotes: opts.weightCutNotes ?? null,
      isAmateur: opts.isAmateur ?? true,
      status: "OPTED_IN",
    },
    update: {
      weightKg: opts.weightKg ?? null,
      level: opts.level ?? null,
      targetWeightClass: opts.targetWeightClass ?? null,
      weightCutNotes: opts.weightCutNotes ?? null,
      isAmateur: opts.isAmateur ?? true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.opt-in",
      entityType: "ChampionshipRegistration",
      entityId: reg.id,
    },
  });
  return reg;
}

export async function coachConfirmRegistration(opts: {
  registrationId: string;
  actorId: string;
}) {
  const { registrationId, actorId } = opts;
  const reg = await prisma.championshipRegistration.findUnique({
    where: { id: registrationId },
    select: { id: true, traineeId: true, status: true },
  });
  if (!reg) throw new ChampionshipError("Registration not found");
  if (reg.status !== "OPTED_IN") {
    throw new ChampionshipError(
      `Registration must be OPTED_IN to be confirmed (got ${reg.status})`,
    );
  }

  // FR-CH-04: medical clearance gate
  const cleared = await isTraineeCleared(reg.traineeId);
  if (!cleared) {
    throw new ChampionshipError(
      "Trainee is not medically cleared (missing or expired clearance). Block confirmation per FR-CH-04.",
    );
  }

  const updated = await prisma.championshipRegistration.update({
    where: { id: registrationId },
    data: { status: "COACH_CONFIRMED", confirmedAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.confirm",
      entityType: "ChampionshipRegistration",
      entityId: registrationId,
    },
  });

  await dispatchNotification({
    recipientUserId: reg.traineeId,
    eventType: "CHAMPIONSHIP_OPEN",
    payload: { name: "Championship participation confirmed", deadline: "—" },
  });

  return updated;
}

export async function withdrawRegistration(opts: {
  registrationId: string;
  actorId: string;
}) {
  const updated = await prisma.championshipRegistration.update({
    where: { id: opts.registrationId },
    data: { status: "WITHDREW" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: "championship.withdraw",
      entityType: "ChampionshipRegistration",
      entityId: opts.registrationId,
    },
  });
  return updated;
}

export const fightResultInputSchema = z.object({
  registrationId: z.string().min(1),
  opponentName: z.string().min(1),
  outcome: z.enum(["WIN", "LOSS", "DRAW", "NO_CONTEST"]),
  method: z.enum(["KO", "TKO", "DECISION", "SUBMISSION", "DQ", "OTHER"]).optional().nullable(),
  round: z.coerce.number().int().min(1).max(20).optional().nullable(),
  timeInRound: z.string().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type FightResultInput = z.infer<typeof fightResultInputSchema>;

export async function recordFightResult(input: FightResultInput, actorId: string) {
  const data = fightResultInputSchema.parse(input);
  const created = await prisma.fightResult.create({
    data: {
      registrationId: data.registrationId,
      opponentName: data.opponentName,
      outcome: data.outcome,
      method: data.method ?? null,
      round: data.round ?? null,
      timeInRound: data.timeInRound ?? null,
      videoUrl: data.videoUrl ?? null,
      notes: data.notes ?? null,
      recordedById: actorId,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.record-result",
      entityType: "FightResult",
      entityId: created.id,
      changes: { outcome: data.outcome },
    },
  });
  return created;
}

export async function careerRecordForTrainee(traineeId: string) {
  const fights = await prisma.fightResult.findMany({
    where: { registration: { traineeId } },
    select: { outcome: true, method: true },
  });
  return aggregateFightRecord(
    fights.map((f): FightRow => ({ outcome: f.outcome, method: f.method })),
  );
}
