// User management service (FR-AUTH-03, 10, 11, 12).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import {
  validatePromotion,
  validateStatusTransition,
  type AccountStatus,
  type UserRole,
} from "@/domain/users/promotion";
import { dispatchNotification } from "@/application/notifications/service";
import argon2 from "argon2";
import type { UserCreateInput, UserUpdateInput } from "./schemas";

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

export async function createUser(data: UserCreateInput, actorId: string) {
  const email = data.email || `${data.phone.replace(/[^0-9]/g, "")}@phone.csk.local`;

  // Check unique constraints
  const existingPhone = await prisma.user.findUnique({
    where: { phone: data.phone },
  });
  if (existingPhone) {
    throw new Error("A user with this phone number already exists.");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existingEmail) {
    throw new Error("A user with this email address already exists.");
  }

  const passwordHash = data.password ? await argon2.hash(data.password) : "";

  const created = await prisma.user.create({
    data: {
      role: data.role,
      email: email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      fullNameAr: data.fullNameAr,
      fullNameEn: data.fullNameEn,
      status: data.status,
      parentManaged: data.parentManaged,
      emailVerifiedAt: data.email ? new Date() : null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "user.create",
      entityType: "User",
      entityId: created.id,
      changes: { role: data.role, status: data.status },
    },
  });

  return created;
}

export async function updateUser(userId: string, data: UserUpdateInput, actorId: string) {
  const email = data.email || `${data.phone.replace(/[^0-9]/g, "")}@phone.csk.local`;

  // Check unique constraints for phone
  const existingPhone = await prisma.user.findFirst({
    where: { phone: data.phone, NOT: { id: userId } },
  });
  if (existingPhone) {
    throw new Error("A user with this phone number already exists.");
  }

  // Check unique constraints for email
  const existingEmail = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), NOT: { id: userId } },
  });
  if (existingEmail) {
    throw new Error("A user with this email address already exists.");
  }

  const updateData: Prisma.UserUpdateInput = {
    role: data.role,
    email: email.toLowerCase(),
    phone: data.phone,
    fullNameAr: data.fullNameAr,
    fullNameEn: data.fullNameEn,
    status: data.status,
    parentManaged: data.parentManaged,
  };

  // Auto-verify email if it is changed/supplied
  if (data.email) {
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    if (!current?.emailVerifiedAt) {
      updateData.emailVerifiedAt = new Date();
    }
  }

  if (data.password) {
    updateData.passwordHash = await argon2.hash(data.password);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "user.update",
      entityType: "User",
      entityId: userId,
      changes: { role: data.role, status: data.status },
    },
  });

  return updated;
}

