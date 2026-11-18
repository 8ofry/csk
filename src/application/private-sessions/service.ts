import type { UserRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { isAtLeast } from "@/lib/rbac";

export const createPrivateSessionSchema = z.object({
  traineeId: z.string().min(1),
  coachId: z.string().min(1),
  locationId: z.string().min(1),
  scheduledStart: z.coerce.date(),
  durationMins: z.coerce.number().int().min(30).max(180).default(60),
  fee: z.coerce.number().positive(),
  notes: z.string().max(1000).optional(),
});

export type CreatePrivateSessionInput = z.infer<typeof createPrivateSessionSchema>;

export async function createPrivateSession(
  input: CreatePrivateSessionInput,
  actorId: string,
) {
  const data = createPrivateSessionSchema.parse(input);
  const scheduledEnd = new Date(data.scheduledStart.getTime() + data.durationMins * 60_000);

  const row = await prisma.privateSession.create({
    data: {
      traineeId: data.traineeId,
      coachId: data.coachId,
      locationId: data.locationId,
      scheduledStart: data.scheduledStart,
      scheduledEnd,
      fee: data.fee,
      status: "SCHEDULED",
      notes: data.notes?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "private_session.create",
      entityType: "PrivateSession",
      entityId: row.id,
      changes: {
        traineeId: data.traineeId,
        coachId: data.coachId,
        scheduledStart: data.scheduledStart.toISOString(),
        fee: data.fee,
      },
    },
  });

  return row;
}

export async function confirmPrivateSession(id: string, actorId: string, actorRole: UserRole) {
  const row = await prisma.privateSession.findUnique({ where: { id } });
  if (!row) throw new Error("Private session not found");
  if (row.coachId !== actorId && !isAtLeast(actorRole, "HEAD_COACH")) {
    throw new Error("Only the assigned coach or Head Coach can confirm");
  }
  if (row.status === "CANCELLED" || row.status === "COMPLETED") {
    throw new Error(`Cannot confirm a ${row.status} session`);
  }

  const updated = await prisma.privateSession.update({
    where: { id },
    data: { confirmedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "private_session.confirm",
      entityType: "PrivateSession",
      entityId: id,
    },
  });

  return updated;
}

export async function completePrivateSession(id: string, actorId: string, actorRole: UserRole) {
  const row = await prisma.privateSession.findUnique({ where: { id } });
  if (!row) throw new Error("Private session not found");
  if (row.coachId !== actorId && !isAtLeast(actorRole, "HEAD_COACH")) {
    throw new Error("Only the assigned coach or Head Coach can complete");
  }
  if (row.status === "CANCELLED") {
    throw new Error("Cannot complete a cancelled session");
  }

  const updated = await prisma.privateSession.update({
    where: { id },
    data: { status: "COMPLETED" },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "private_session.complete",
      entityType: "PrivateSession",
      entityId: id,
    },
  });

  return updated;
}

export async function cancelPrivateSession(
  id: string,
  actorId: string,
  actorRole: UserRole,
  reason?: string,
) {
  const row = await prisma.privateSession.findUnique({ where: { id } });
  if (!row) throw new Error("Private session not found");
  const isParticipant = row.traineeId === actorId || row.coachId === actorId;
  if (!isParticipant && !isAtLeast(actorRole, "HEAD_COACH")) {
    throw new Error("Forbidden");
  }
  if (row.status === "COMPLETED") {
    throw new Error("Cannot cancel a completed session");
  }

  const updated = await prisma.privateSession.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancellationReason: reason?.trim() || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "private_session.cancel",
      entityType: "PrivateSession",
      entityId: id,
      changes: { reason: reason ?? null },
    },
  });

  return updated;
}

export async function listPrivateSessionsForUser(userId: string, role: UserRole) {
  const where = isAtLeast(role, "HEAD_COACH")
    ? {}
    : role === "COACH" || role === "INTERN"
      ? { coachId: userId }
      : { traineeId: userId };

  return prisma.privateSession.findMany({
    where,
    include: {
      trainee: { select: { id: true, fullNameEn: true, fullNameAr: true, email: true } },
      coach: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      location: { select: { id: true, nameEn: true, nameAr: true } },
    },
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });
}
