"use server";

import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "@/infrastructure/db/prisma";
import { Prisma } from "@prisma/client";
import { emailAdapter } from "@/infrastructure/notifications/adapter";
import { generateVerificationToken } from "@/lib/verification-token";

const registerSchema = z.object({
  fullNameAr: z.string().min(2),
  fullNameEn: z.string().min(2),
  email: z.string().email().transform((s) => s.toLowerCase()),
  phone: z.string().min(7),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one digit"),
  // FR-AUTH-01: only Coach/Intern/Trainee can self-register
  role: z.enum(["COACH", "INTERN", "TRAINEE"]),
});

export async function registerAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = registerSchema.safeParse({
    fullNameAr: formData.get("fullNameAr"),
    fullNameEn: formData.get("fullNameEn"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Invalid form input" };
  }

  const passwordHash = await argon2.hash(parsed.data.password);

  try {
    await prisma.user.create({
      data: {
        role: parsed.data.role,
        email: parsed.data.email,
        phone: parsed.data.phone,
        passwordHash,
        fullNameAr: parsed.data.fullNameAr,
        fullNameEn: parsed.data.fullNameEn,
        status: "PENDING", // FR-AUTH-03
        preferredLocale: "AR",
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "An account with this email or phone already exists." };
    }
    throw e;
  }

  // FR-AUTH-02: generate verification token and send email
  const token = generateVerificationToken(parsed.data.email);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyLink = `${baseUrl}/api/v1/auth/verify?token=${token}`;
  
  await emailAdapter().send({
    to: { email: parsed.data.email },
    subject: "Verify your CSK Academy Account",
    body: `Hello ${parsed.data.fullNameEn},\n\nPlease verify your email by clicking the following link:\n${verifyLink}\n\nWelcome to Team Cap Saied!`,
    notificationId: `verify-${Date.now()}`
  });

  return {};
}
