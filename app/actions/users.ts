"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  approveUser,
  promoteInternToCoach,
  setUserStatus,
} from "@/application/users/service";
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
