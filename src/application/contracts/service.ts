// Coach contracts (FR-FIN-09).
// Per-coach percentages override location defaults at payment time.

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";

export const contractInputSchema = z
  .object({
    coachId: z.string().min(1),
    locationId: z.string().nullable().optional(),
    disciplineId: z.string().nullable().optional(),
    subscriptionPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    privateSessionPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    privateSessionFixedRate: z.coerce.number().min(0).nullable().optional(),
    beltExamPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    championshipPercent: z.coerce.number().min(0).max(100).nullable().optional(),
    effectiveFrom: z.coerce.date().optional(),
    effectiveTo: z.coerce.date().nullable().optional(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    (d) =>
      d.subscriptionPercent != null ||
      d.privateSessionPercent != null ||
      d.privateSessionFixedRate != null ||
      d.beltExamPercent != null ||
      d.championshipPercent != null,
    { message: "Set at least one override (otherwise location defaults already apply)" },
  );

export type ContractInput = z.infer<typeof contractInputSchema>;

export async function listContracts(filters: { coachId?: string } = {}) {
  return prisma.coachContract.findMany({
    where: { coachId: filters.coachId, active: true },
    orderBy: [{ coachId: "asc" }, { effectiveFrom: "desc" }],
    include: {
      coach: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      location: { select: { id: true, nameEn: true } },
      discipline: { select: { id: true, nameEn: true } },
    },
  });
}

export async function getContract(id: string) {
  return prisma.coachContract.findUnique({
    where: { id },
    include: {
      coach: { select: { id: true, fullNameEn: true } },
      location: { select: { id: true, nameEn: true } },
      discipline: { select: { id: true, nameEn: true } },
    },
  });
}

export async function createContract(input: ContractInput, actorId: string) {
  const data = contractInputSchema.parse(input);
  const created = await prisma.coachContract.create({
    data: {
      coachId: data.coachId,
      locationId: data.locationId ?? null,
      disciplineId: data.disciplineId ?? null,
      subscriptionPercent: pct(data.subscriptionPercent),
      privateSessionPercent: pct(data.privateSessionPercent),
      privateSessionFixedRate: dec(data.privateSessionFixedRate),
      beltExamPercent: pct(data.beltExamPercent),
      championshipPercent: pct(data.championshipPercent),
      effectiveFrom: data.effectiveFrom ?? new Date(),
      effectiveTo: data.effectiveTo ?? null,
      active: true,
      notes: data.notes ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "coach-contract.create",
      entityType: "CoachContract",
      entityId: created.id,
    },
  });
  return created;
}

export async function updateContract(id: string, input: ContractInput, actorId: string) {
  const data = contractInputSchema.parse(input);
  const updated = await prisma.coachContract.update({
    where: { id },
    data: {
      subscriptionPercent: pct(data.subscriptionPercent),
      privateSessionPercent: pct(data.privateSessionPercent),
      privateSessionFixedRate: dec(data.privateSessionFixedRate),
      beltExamPercent: pct(data.beltExamPercent),
      championshipPercent: pct(data.championshipPercent),
      effectiveFrom: data.effectiveFrom ?? undefined,
      effectiveTo: data.effectiveTo ?? null,
      notes: data.notes ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "coach-contract.update",
      entityType: "CoachContract",
      entityId: id,
    },
  });
  return updated;
}

export async function archiveContract(id: string, actorId: string) {
  await prisma.coachContract.update({
    where: { id },
    data: { active: false, effectiveTo: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "coach-contract.archive",
      entityType: "CoachContract",
      entityId: id,
    },
  });
}

function pct(v: number | null | undefined) {
  return v == null ? null : new Prisma.Decimal(v);
}

function dec(v: number | null | undefined) {
  return v == null ? null : new Prisma.Decimal(v);
}
