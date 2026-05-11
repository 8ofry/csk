"use server";

import { signIn } from "@/auth";
import { prisma } from "@/infrastructure/db/prisma";
import { dashboardPathFor } from "@/lib/rbac";
import { AuthError } from "next-auth";

export async function signInAction(
  formData: FormData,
): Promise<{ error?: string; redirectTo?: string }> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Please enter your credentials." };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid credentials or account not active." };
    }
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
    select: { role: true },
  });

  return { redirectTo: user ? dashboardPathFor(user.role) : "/" };
}
