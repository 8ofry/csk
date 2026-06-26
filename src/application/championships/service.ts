// Championships (FR-CH-01..07).
// Workflow: HC creates → Trainee opts in → Coach confirms → Trainee pays
// (medical clearance gate at confirmation per FR-CH-04) → Coach records result.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { isTraineeCleared } from "@/application/medical/service";
import { aggregateFightRecord, type FightRow } from "@/domain/championships/fight-record";
import { dispatchNotification } from "@/application/notifications/service";
import argon2 from "argon2";
import { Gender, FightClass } from "@prisma/client";
import { ExternalSignupInput, FighterRegisterInput, InstapayPaymentInput, MatchResultInput } from "./schemas";

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

export async function registerExternalAcademyAndCoach(input: ExternalSignupInput) {
  const passwordHash = await argon2.hash(input.password);

  return prisma.$transaction(async (tx) => {
    // 1. Create Academy
    const academy = await tx.academy.create({
      data: {
        nameAr: input.academyNameAr,
        nameEn: input.academyNameEn,
      },
    });

    // 2. Create Coach User linked to Academy
    const coach = await tx.user.create({
      data: {
        role: "COACH",
        email: input.email.toLowerCase(),
        phone: input.phone,
        passwordHash,
        fullNameAr: input.fullNameAr,
        fullNameEn: input.fullNameEn,
        status: "ACTIVE",
        isExternal: true,
        academyId: academy.id,
        emailVerifiedAt: new Date(),
        preferredLocale: "EN",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: coach.id,
        action: "academy.external-signup",
        entityType: "Academy",
        entityId: academy.id,
        changes: { coachName: input.fullNameEn },
      },
    });

    return { academy, coach };
  });
}

export async function registerExternalFighter(input: FighterRegisterInput, coachId: string) {
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { academyId: true, isExternal: true },
  });
  if (!coach || !coach.academyId) {
    throw new Error("Coach or associated Academy not found");
  }

  const phoneOnlyEmail = `${input.phone.replace(/[^0-9]/g, "")}@external.csk.local`;

  // Generate unique registration number
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  const count = await prisma.championshipRegistration.count({
    where: { championshipId: input.championshipId },
  });
  const registrationNumber = `CSK-CHAMP-${dateStr}-${String(count + 1).padStart(4, "0")}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create Trainee User
    const fighter = await tx.user.create({
      data: {
        role: "TRAINEE",
        email: phoneOnlyEmail,
        phone: input.phone,
        passwordHash: "",
        fullNameAr: input.fullNameAr,
        fullNameEn: input.fullNameEn,
        gender: input.gender,
        dob: input.dob,
        status: "ACTIVE",
        isExternal: true,
        academyId: coach.academyId,
        emailVerifiedAt: new Date(),
        preferredLocale: "EN",
      },
    });

    // 2. Create Championship Registration
    const reg = await tx.championshipRegistration.create({
      data: {
        championshipId: input.championshipId,
        traineeId: fighter.id,
        weightKg: input.weightKg,
        fightClass: input.fightClass,
        photoUrl: input.photoUrl ?? null,
        registrationNumber,
        status: "COACH_CONFIRMED",
        confirmedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: coachId,
        action: "fighter.register",
        entityType: "ChampionshipRegistration",
        entityId: reg.id,
      },
    });

    return { fighter, reg };
  });
}

export async function submitInstapayPayment(input: InstapayPaymentInput, actorId: string) {
  const updated = await prisma.championshipRegistration.update({
    where: { id: input.registrationId },
    data: {
      status: "PENDING_VERIFICATION",
      instapayRef: input.instapayRef,
      paymentReceiptUrl: input.paymentReceiptUrl ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.submit-payment",
      entityType: "ChampionshipRegistration",
      entityId: input.registrationId,
      changes: { ref: input.instapayRef },
    },
  });

  return updated;
}

export async function verifyInstapayPayment(registrationId: string, actorId: string) {
  const updated = await prisma.championshipRegistration.update({
    where: { id: registrationId },
    data: { status: "PAID" },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "championship.verify-payment",
      entityType: "ChampionshipRegistration",
      entityId: registrationId,
    },
  });

  return updated;
}

export async function runAutomatedMatchmaking(championshipId: string, actorId: string) {
  const registrations = await prisma.championshipRegistration.findMany({
    where: {
      championshipId,
      status: "PAID",
      fightClass: { not: null },
      trainee: { gender: { not: null } },
    },
    include: { trainee: { select: { gender: true } } },
  });

  // Group by Gender & FightClass
  type GroupKey = string;
  const groups: Record<GroupKey, typeof registrations> = {};
  for (const r of registrations) {
    const key = `${r.trainee.gender}-${r.fightClass}`;
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(r);
  }

  const createdMatches: any[] = [];

  await prisma.$transaction(async (tx) => {
    // Delete any existing matches for this championship first to regenerate
    await tx.match.deleteMany({
      where: { championshipId },
    });

    for (const key of Object.keys(groups)) {
      const fighters = groups[key]!;
      // Sort ascending by weight
      fighters.sort((a, b) => Number(a.weightKg ?? 0) - Number(b.weightKg ?? 0));

      // Pair adjacent fighters
      for (let i = 0; i < fighters.length - 1; i += 2) {
        const f1 = fighters[i]!;
        const f2 = fighters[i + 1]!;
        const weightClass = `${Math.round((Number(f1.weightKg ?? 0) + Number(f2.weightKg ?? 0)) / 2)} kg`;

        const m = await tx.match.create({
          data: {
            championshipId,
            fighter1Id: f1.id,
            fighter2Id: f2.id,
            gender: f1.trainee.gender!,
            fightClass: f1.fightClass!,
            weightClass,
          },
        });
        createdMatches.push(m);
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "championship.matchmake",
        entityType: "Championship",
        entityId: championshipId,
        changes: { count: createdMatches.length },
      },
    });
  });

  return createdMatches;
}

export async function recordMatchResult(input: MatchResultInput, actorId: string) {
  const match = await prisma.match.findUnique({
    where: { id: input.matchId },
    select: { fighter1Id: true, fighter2Id: true, championshipId: true },
  });
  if (!match) throw new Error("Match not found");

  const winnerId = input.winnerId || null;

  return prisma.$transaction(async (tx) => {
    // 1. Update Match record
    const updatedMatch = await tx.match.update({
      where: { id: input.matchId },
      data: {
        winnerId,
        outcome: input.outcome,
        method: input.method ?? null,
        round: input.round ?? null,
        timeInRound: input.timeInRound ?? null,
        videoUrl: input.videoUrl || null,
        notes: input.notes ?? null,
      },
    });

    // Delete any existing FightResult linked to these registrations for this championship
    await tx.fightResult.deleteMany({
      where: {
        registrationId: { in: [match.fighter1Id, match.fighter2Id] },
      },
    });

    // 2. Generate scorecard/FightResult entries
    if (input.outcome === "WIN" && winnerId) {
      const loserId = winnerId === match.fighter1Id ? match.fighter2Id : match.fighter1Id;
      const winnerName = winnerId === match.fighter1Id ? "Fighter 1" : "Fighter 2";
      const loserName = winnerId === match.fighter1Id ? "Fighter 2" : "Fighter 1";

      await tx.fightResult.create({
        data: {
          registrationId: winnerId,
          opponentName: loserName,
          outcome: "WIN",
          method: input.method ?? null,
          round: input.round ?? null,
          timeInRound: input.timeInRound ?? null,
          videoUrl: input.videoUrl || null,
          notes: input.notes ?? null,
          recordedById: actorId,
        },
      });

      await tx.fightResult.create({
        data: {
          registrationId: loserId,
          opponentName: winnerName,
          outcome: "LOSS",
          method: input.method ?? null,
          round: input.round ?? null,
          timeInRound: input.timeInRound ?? null,
          videoUrl: input.videoUrl || null,
          notes: input.notes ?? null,
          recordedById: actorId,
        },
      });
    } else if (input.outcome === "DRAW") {
      await tx.fightResult.create({
        data: {
          registrationId: match.fighter1Id,
          opponentName: "Fighter 2",
          outcome: "DRAW",
          method: input.method ?? null,
          round: input.round ?? null,
          timeInRound: input.timeInRound ?? null,
          videoUrl: input.videoUrl || null,
          notes: input.notes ?? null,
          recordedById: actorId,
        },
      });
      await tx.fightResult.create({
        data: {
          registrationId: match.fighter2Id,
          opponentName: "Fighter 1",
          outcome: "DRAW",
          method: input.method ?? null,
          round: input.round ?? null,
          timeInRound: input.timeInRound ?? null,
          videoUrl: input.videoUrl || null,
          notes: input.notes ?? null,
          recordedById: actorId,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "match.record-result",
        entityType: "Match",
        entityId: input.matchId,
        changes: { outcome: input.outcome, winnerId },
      },
    });

    return updatedMatch;
  });
}

