import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "@/infrastructure/db/prisma";
import { dispatchNotification } from "@/application/notifications/service";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function getBaseUrl(): string {
  return (process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function requestPasswordReset(email: string, locale: "ar" | "en" = "en") {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true as const };

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, status: true },
  });

  if (!user || user.status === "SUSPENDED") {
    return { ok: true as const };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const url = `${getBaseUrl()}/${locale}/reset-password?token=${rawToken}`;
  await dispatchNotification({
    recipientUserId: user.id,
    eventType: "PASSWORD_RESET",
    payload: { url },
    channels: ["EMAIL"],
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "auth.password_reset.requested",
      entityType: "User",
      entityId: user.id,
    },
  });

  return { ok: true as const };
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string) {
  if (!rawToken || newPassword.length < 8) {
    throw new Error("Invalid token or password (min 8 characters)");
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });

  if (!record || record.usedAt || record.expiresAt <= now) {
    throw new Error("Reset link is invalid or has expired");
  }

  const passwordHash = await argon2.hash(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now },
    }),
    prisma.auditLog.create({
      data: {
        actorId: record.userId,
        action: "auth.password_reset.completed",
        entityType: "User",
        entityId: record.userId,
      },
    }),
  ]);

  return { ok: true as const };
}
