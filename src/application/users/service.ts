// User management service (FR-AUTH-03, 10, 11, 12).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import {
  validatePromotion,
  validateStatusTransition,
  type AccountStatus,
  type UserRole,
} from "@/domain/users/promotion";
import { dispatchNotification } from "@/application/notifications/service";

export interface UserFilters {
  role?: UserRole;
  status?: AccountStatus;
  search?: string;
}

export async function listUsers(filters: UserFilters = {}, take = 200) {
  return prisma.user.findMany({
    where: {
      role: filters.role,
      status: filters.status,
      OR: filters.search
        ? [
            { fullNameEn: { contains: filters.search, mode: "insensitive" } },
            { fullNameAr: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
          ]
        : undefined,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      role: true,
      status: true,
      email: true,
      phone: true,
      fullNameEn: true,
      fullNameAr: true,
      preferredLocale: true,
      parentManaged: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function listPending() {
  return prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      email: true,
      phone: true,
      fullNameEn: true,
      fullNameAr: true,
      createdAt: true,
    },
  });
}

export async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, fullNameEn: true } },
      children: { select: { id: true, fullNameEn: true } },
      coachContracts: {
        include: {
          location: { select: { id: true, nameEn: true } },
          discipline: { select: { id: true, nameEn: true } },
        },
        orderBy: { effectiveFrom: "desc" },
      },
    },
  });
}

export const approveUserInputSchema = z.object({
  userId: z.string().min(1),
  /** v1: just sets status to ACTIVE; role-specific assignment (groups/contracts) happens in their dedicated screens. */
});

export async function approveUser(userId: string, actorId: string, appUrl: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, status: true, role: true },
  });
  if (!user) throw new Error("User not found");
  validateStatusTransition(user.status, "ACTIVE");
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "user.approve",
      entityType: "User",
      entityId: userId,
      changes: { from: user.status, to: "ACTIVE" },
    },
  });

  // FR-AUTH-04: send welcome message on activation
  await dispatchNotification({
    recipientUserId: userId,
    eventType: "WELCOME_ON_ACTIVATION",
    payload: { name: "", appUrl },
  });

  return updated;
}

export async function setUserStatus(
  userId: string,
  next: AccountStatus,
  actorId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user) throw new Error("User not found");
  validateStatusTransition(user.status, next);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: next },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: `user.status.${next.toLowerCase()}`,
      entityType: "User",
      entityId: userId,
      changes: { from: user.status, to: next },
    },
  });
  if (user.status === "PENDING" && next === "ACTIVE") {
    // covered by approveUser elsewhere; keep here too for status-flip path
    await dispatchNotification({
      recipientUserId: userId,
      eventType: "ACCOUNT_APPROVAL",
      payload: { decision: "activated" },
    });
  }
  return updated;
}

export async function promoteInternToCoach(userId: string, actorId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) throw new Error("User not found");
  validatePromotion(user.role, "COACH");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { role: "COACH" },
    });
    // End any active intern assignments (the user is no longer shadowing).
    await tx.internAssignment.updateMany({
      where: { internId: userId, active: true },
      data: { active: false, endedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorId,
        action: "user.promote.intern-to-coach",
        entityType: "User",
        entityId: userId,
      },
    });
    return updated;
  });
}
