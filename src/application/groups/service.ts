// Groups service (FR-GRP-01..07).
// Responsibilities:
//  - Validate group definition (FR-GRP-01)
//  - Enforce capacity with override (FR-GRP-03)
//  - Manage enrollments (FR-GRP-02)

import { prisma } from "@/infrastructure/db/prisma";
import { groupInputSchema, type GroupInput } from "./schemas";

export class GroupCapacityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GroupCapacityError";
  }
}

export async function listGroups(filters?: { locationId?: string; active?: boolean }) {
  return prisma.group.findMany({
    where: {
      locationId: filters?.locationId,
      active: filters?.active,
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    include: {
      location: { select: { id: true, nameEn: true, nameAr: true } },
      discipline: { select: { id: true, nameEn: true, nameAr: true, category: true } },
      primaryCoach: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      intern: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

export async function getGroup(id: string) {
  return prisma.group.findUnique({
    where: { id },
    include: {
      location: true,
      discipline: true,
      primaryCoach: true,
      intern: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          trainee: {
            select: { id: true, fullNameEn: true, fullNameAr: true, profilePhotoUrl: true },
          },
        },
      },
    },
  });
}

export async function createGroup(input: GroupInput, actorId: string) {
  const data = groupInputSchema.parse(input);
  const created = await prisma.group.create({
    data: {
      name: data.name,
      locationId: data.locationId,
      disciplineId: data.disciplineId,
      primaryCoachId: data.primaryCoachId ?? null,
      internId: data.internId ?? null,
      levelBand: data.levelBand ?? null,
      ageBandMin: data.ageBandMin ?? null,
      ageBandMax: data.ageBandMax ?? null,
      schedule: data.schedule,
      capacity: data.capacity,
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "group.create",
      entityType: "Group",
      entityId: created.id,
      changes: { ...data, schedule: data.schedule },
    },
  });
  return created;
}

export async function updateGroup(id: string, input: GroupInput, actorId: string) {
  const data = groupInputSchema.parse(input);
  const updated = await prisma.group.update({
    where: { id },
    data: {
      name: data.name,
      locationId: data.locationId,
      disciplineId: data.disciplineId,
      primaryCoachId: data.primaryCoachId ?? null,
      internId: data.internId ?? null,
      levelBand: data.levelBand ?? null,
      ageBandMin: data.ageBandMin ?? null,
      ageBandMax: data.ageBandMax ?? null,
      schedule: data.schedule,
      capacity: data.capacity,
      active: data.active,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "group.update",
      entityType: "Group",
      entityId: id,
      changes: { ...data },
    },
  });
  return updated;
}

export async function enrollTrainee(opts: {
  groupId: string;
  traineeId: string;
  actorId: string;
  overrideCapacity?: boolean;
}) {
  const { groupId, traineeId, actorId, overrideCapacity } = opts;

  return prisma.$transaction(async (tx) => {
    const group = await tx.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
    });
    if (!group) throw new Error("Group not found");

    if (group._count.enrollments >= group.capacity && !overrideCapacity) {
      throw new GroupCapacityError(
        `Group is at capacity (${group.capacity}). Use override to add anyway.`,
      );
    }

    const enrollment = await tx.enrollment.create({
      data: {
        groupId,
        traineeId,
        status: "ACTIVE",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: overrideCapacity ? "group.enroll.override" : "group.enroll",
        entityType: "Enrollment",
        entityId: enrollment.id,
        changes: { groupId, traineeId, overrideCapacity: !!overrideCapacity },
      },
    });

    return enrollment;
  });
}

export async function endEnrollment(opts: {
  enrollmentId: string;
  actorId: string;
}) {
  const { enrollmentId, actorId } = opts;
  const updated = await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "ENDED", endDate: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "group.unenroll",
      entityType: "Enrollment",
      entityId: enrollmentId,
    },
  });
  return updated;
}
