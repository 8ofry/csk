// Training Units service (FR-UNIT-01..06).
//  - Only Head Coach (or above) writes; coaches/interns read.
//  - Each save bumps version + records a TrainingUnitVersion snapshot for FR-UNIT-06.

import { prisma } from "@/infrastructure/db/prisma";
import { storage } from "@/infrastructure/storage/storage";
import {
  trainingUnitInputSchema,
  trainingUnitFiltersSchema,
  type TrainingUnitInput,
  type TrainingUnitFilters,
} from "./schemas";

export async function listTrainingUnits(filters: TrainingUnitFilters = {}) {
  const f = trainingUnitFiltersSchema.parse(filters);

  return prisma.trainingUnit.findMany({
    where: {
      published: f.publishedOnly ? true : undefined,
      category: f.category,
      difficulty: f.difficulty,
      disciplines: f.disciplineId
        ? { some: { disciplineId: f.disciplineId } }
        : undefined,
      targetSkills: f.targetSkill ? { has: f.targetSkill } : undefined,
      equipmentRequired: f.equipment ? { has: f.equipment } : undefined,
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      disciplines: { include: { discipline: { select: { id: true, nameEn: true, category: true } } } },
      _count: { select: { versions: true } },
    },
  });
}

export async function getTrainingUnit(id: string) {
  return prisma.trainingUnit.findUnique({
    where: { id },
    include: {
      disciplines: { include: { discipline: true } },
      versions: { orderBy: { version: "desc" }, take: 5 },
      createdBy: { select: { fullNameEn: true, fullNameAr: true } },
    },
  });
}

async function validateMediaUrlIfPresent(url: string | null | undefined) {
  if (!url) return null;
  const stored = await storage.acceptUrl({ scope: "training-unit", url });
  return stored.url;
}

export async function createTrainingUnit(input: TrainingUnitInput, actorId: string) {
  const data = trainingUnitInputSchema.parse(input);
  await validateMediaUrlIfPresent(data.demoMediaUrl ?? null);

  return prisma.$transaction(async (tx) => {
    const created = await tx.trainingUnit.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr ?? null,
        descriptionEn: data.descriptionEn ?? null,
        category: data.category,
        targetBodyParts: data.targetBodyParts,
        targetSkills: data.targetSkills,
        difficulty: data.difficulty,
        recommendedDurationSeconds: data.recommendedDurationSeconds ?? null,
        recommendedRounds: data.recommendedRounds ?? null,
        recommendedRoundDurationSec: data.recommendedRoundDurationSec ?? null,
        equipmentRequired: data.equipmentRequired,
        demoMediaUrl: data.demoMediaUrl ?? null,
        demoMediaType: data.demoMediaType ?? null,
        published: data.published,
        version: 1,
        createdById: actorId,
        disciplines: {
          create: data.disciplineIds.map((disciplineId) => ({ disciplineId })),
        },
      },
    });

    await tx.trainingUnitVersion.create({
      data: {
        trainingUnitId: created.id,
        version: 1,
        snapshot: data as object,
        changedById: actorId,
        changeNote: "Initial version",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "training-unit.create",
        entityType: "TrainingUnit",
        entityId: created.id,
      },
    });

    return created;
  });
}

export async function updateTrainingUnit(
  id: string,
  input: TrainingUnitInput,
  actorId: string,
  changeNote?: string,
) {
  const data = trainingUnitInputSchema.parse(input);
  await validateMediaUrlIfPresent(data.demoMediaUrl ?? null);

  const before = await prisma.trainingUnit.findUnique({ where: { id } });
  if (!before) throw new Error("Training unit not found");

  return prisma.$transaction(async (tx) => {
    const newVersion = before.version + 1;

    const updated = await tx.trainingUnit.update({
      where: { id },
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        descriptionAr: data.descriptionAr ?? null,
        descriptionEn: data.descriptionEn ?? null,
        category: data.category,
        targetBodyParts: data.targetBodyParts,
        targetSkills: data.targetSkills,
        difficulty: data.difficulty,
        recommendedDurationSeconds: data.recommendedDurationSeconds ?? null,
        recommendedRounds: data.recommendedRounds ?? null,
        recommendedRoundDurationSec: data.recommendedRoundDurationSec ?? null,
        equipmentRequired: data.equipmentRequired,
        demoMediaUrl: data.demoMediaUrl ?? null,
        demoMediaType: data.demoMediaType ?? null,
        published: data.published,
        version: newVersion,
        disciplines: {
          deleteMany: {},
          create: data.disciplineIds.map((disciplineId) => ({ disciplineId })),
        },
      },
    });

    await tx.trainingUnitVersion.create({
      data: {
        trainingUnitId: id,
        version: newVersion,
        snapshot: data as object,
        changedById: actorId,
        changeNote: changeNote ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "training-unit.update",
        entityType: "TrainingUnit",
        entityId: id,
        changes: { from: before.version, to: newVersion },
      },
    });

    return updated;
  });
}

export async function archiveTrainingUnit(id: string, actorId: string) {
  await prisma.trainingUnit.update({ where: { id }, data: { published: false } });
  await prisma.auditLog.create({
    data: { actorId, action: "training-unit.archive", entityType: "TrainingUnit", entityId: id },
  });
}
