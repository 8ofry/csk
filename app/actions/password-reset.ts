"use server";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { z } from "zod";
import { rateLimitStore, RATE_LIMITS } from "@/infrastructure/rate-limit/store";
import { requestPasswordReset, resetPasswordWithToken } from "@/application/auth/password-reset";

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
});

export async function requestPasswordResetAction(formData: FormData) {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimitStore.check(`auth:pw-reset:${ip}`, RATE_LIMITS.authLogin);
  if (!rl.allowed) {
    return { error: "Too many requests. Please wait a few minutes and try again." };
  }

  const parsed = forgotSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  await requestPasswordReset(parsed.data.email, locale);
  return { ok: true as const };
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Password must be at least 8 characters." };
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "Passwords do not match." };
  }

  try {
    await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    return { ok: true as const };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to reset password" };
  }
}
