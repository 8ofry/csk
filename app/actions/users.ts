"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  approveUser,
  promoteInternToCoach,
  setUserStatus,
  createUser,
  updateUser,
} from "@/application/users/service";
import { userCreateInputSchema, userUpdateInputSchema } from "@/application/users/schemas";
import { requireRole } from "@/lib/auth-guard";

async function appUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function approveUserAction(
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await approveUser(userId, user.id, await appUrl());
    revalidatePath("/admin/users");
    revalidatePath("/head-coach/users");
    revalidatePath("/head-coach/approvals");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function suspendUserAction(
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await setUserStatus(userId, "SUSPENDED", user.id);
    revalidatePath("/admin/users");
    revalidatePath("/head-coach/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reactivateUserAction(
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await setUserStatus(userId, "ACTIVE", user.id);
    revalidatePath("/admin/users");
    revalidatePath("/head-coach/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function promoteInternAction(
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await promoteInternToCoach(userId, user.id);
    revalidatePath("/admin/users");
    revalidatePath("/head-coach/users");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createUserAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const actor = await requireRole("HEAD_COACH");

    const parsed = userCreateInputSchema.safeParse({
      fullNameAr: formData.get("fullNameAr"),
      fullNameEn: formData.get("fullNameEn"),
      phone: String(formData.get("phone") ?? "").replace(/\s+/g, ""),
      email: formData.get("email") || undefined,
      password: formData.get("password") || undefined,
      role: formData.get("role"),
      status: formData.get("status") || "ACTIVE",
      parentManaged: formData.get("parentManaged") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    const created = await createUser(parsed.data, actor.id);
    revalidatePath("/admin/users");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateUserAction(
  userId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const actor = await requireRole("HEAD_COACH");

    const parsed = userUpdateInputSchema.safeParse({
      fullNameAr: formData.get("fullNameAr"),
      fullNameEn: formData.get("fullNameEn"),
      phone: String(formData.get("phone") ?? "").replace(/\s+/g, ""),
      email: formData.get("email") || undefined,
      password: formData.get("password") || undefined,
      role: formData.get("role"),
      status: formData.get("status"),
      parentManaged: formData.get("parentManaged") === "on",
    });

    if (!parsed.success) {
      return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
    }

    await updateUser(userId, parsed.data, actor.id);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

