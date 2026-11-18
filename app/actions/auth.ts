"use server";

import { headers } from "next/headers";
import { signIn } from "@/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { dashboardPathFor } from "@/lib/rbac";
import { rateLimitStore, RATE_LIMITS } from "@/infrastructure/rate-limit/store";
import { AuthError } from "next-auth";

export async function signInAction(
  formData: FormData,
): Promise<{ error?: string; redirectTo?: string }> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Please enter your credentials." };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const decision = await rateLimitStore.check(
    `web:login:${ip}:${identifier.toLowerCase()}`,
    RATE_LIMITS.authLogin,
  );
  if (!decision.allowed) {
    return { error: "Too many login attempts. Please try again later." };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      await prisma.auditLog.create({
        data: {
          action: "auth.login.failed",
          entityType: "User",
          changes: { identifier: identifier.toLowerCase(), ip },
        },
      });
      return { error: "Invalid credentials or account not active." };
    }
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
    select: { id: true, role: true },
  });

  if (user) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "auth.login.success",
        entityType: "User",
        entityId: user.id,
        changes: { ip },
      },
    });
  }

  return { redirectTo: user ? dashboardPathFor(user.role) : "/" };
}
