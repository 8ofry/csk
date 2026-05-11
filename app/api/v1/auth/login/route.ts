// POST /api/v1/auth/login
// Body: { identifier (email | phone), password, deviceLabel? }
// Returns: { token, expiresAt, user: { id, role, name, locale } }
//
// Rate-limited per IP and lightly logged on failure (no PII).

import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "@/infrastructure/db/prisma";
import { issueToken } from "@/application/api-tokens/service";
import { jsonError, jsonResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { logger } from "@/infrastructure/observability/logger";

const FAIL_GENERIC = "Invalid credentials or account not active.";

const inputSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
  deviceLabel: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  // 5 login attempts per minute per IP — same threshold as the contact form.
  const limited = await checkRateLimit(req, {
    bucket: "api:auth.login",
    config: { capacity: 5, refillPerSecond: 5 / 60 },
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");

  const { identifier, password, deviceLabel } = parsed.data;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
    },
    select: {
      id: true,
      email: true,
      phone: true,
      passwordHash: true,
      status: true,
      emailVerifiedAt: true,
      role: true,
      preferredLocale: true,
      fullNameEn: true,
      fullNameAr: true,
    },
  });
  if (!user || user.status !== "ACTIVE" || !user.emailVerifiedAt) {
    logger.info("Mobile login rejected (no active user)", { tags: { identifier } });
    return jsonError(FAIL_GENERIC, 401);
  }

  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) {
    logger.info("Mobile login rejected (bad password)", { tags: { uid: user.id } });
    return jsonError(FAIL_GENERIC, 401);
  }

  const issued = await issueToken({ userId: user.id, label: deviceLabel ?? "Mobile app" });
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "api-token.issue",
      entityType: "ApiToken",
      entityId: issued.id,
      changes: { label: deviceLabel ?? "Mobile app" },
    },
  });

  return jsonResponse({
    token: issued.token,
    tokenPrefix: issued.prefix,
    expiresAt: issued.expiresAt.toISOString(),
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      fullNameEn: user.fullNameEn,
      fullNameAr: user.fullNameAr,
      preferredLocale: user.preferredLocale,
    },
  });
}
