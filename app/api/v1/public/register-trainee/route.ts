// POST /api/v1/public/register-trainee
// JSON-body version of the public registration form. Creates a PENDING trainee
// account; Head Coach must approve before login (FR-AUTH-03).

import { z } from "zod";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/prisma";
import { jsonError, jsonResponse } from "@/lib/api";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { RATE_LIMITS } from "@/infrastructure/rate-limit/store";
import { emailAdapter } from "@/infrastructure/notifications/adapter";
import { dispatchNotification } from "@/application/notifications/service";
import { generateVerificationToken } from "@/lib/verification-token";

const inputSchema = z.object({
  fullNameAr: z.string().min(2),
  fullNameEn: z.string().min(2),
  email: z.string().email().transform((s) => s.toLowerCase()),
  phone: z.string().min(7),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, "Password must include a letter")
    .regex(/[0-9]/, "Password must include a digit"),
  preferredLocale: z.enum(["AR", "EN"]).default("AR"),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(req, {
    bucket: "public:register",
    config: RATE_LIMITS.publicRegister,
  });
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  try {
    await prisma.user.create({
      data: {
        role: "TRAINEE",
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash: await argon2.hash(parsed.data.password),
        fullNameAr: parsed.data.fullNameAr,
        fullNameEn: parsed.data.fullNameEn,
        preferredLocale: parsed.data.preferredLocale,
        status: "PENDING",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return jsonError("An account with this email or phone already exists.", 409);
    }
    return jsonError("Could not create account", 500);
  }

  const token = generateVerificationToken(parsed.data.email);
  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyLink = `${baseUrl}/api/v1/auth/verify?token=${token}`;
  await emailAdapter().send({
    to: { email: parsed.data.email },
    subject: "Verify your CSK Academy Account",
    body: `Hello ${parsed.data.fullNameEn},\n\nPlease verify your email:\n${verifyLink}\n\nYour account will become active after staff approval.`,
    notificationId: `verify-api-${Date.now()}`,
  });

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "HEAD_COACH"] }, status: "ACTIVE" },
    select: { id: true },
  });
  for (const s of staff) {
    await dispatchNotification({
      recipientUserId: s.id,
      eventType: "ACCOUNT_APPROVAL",
      payload: { decision: `Pending trainee registration: ${parsed.data.fullNameEn}` },
      channels: ["IN_APP"],
    });
  }

  return jsonResponse({ ok: true, status: "PENDING" }, { status: 202 });
}
