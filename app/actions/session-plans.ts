"use server";

import { revalidatePath } from "next/cache";
import {
  approvePlan,
  createDraftPlan,
  pullBackPlan,
  rejectPlan,
  resubmitPlan,
  submitPlan,
  updateDraftPlan,
  reviewPlan,
} from "@/application/session-plans/service";
import { sessionPlanInputSchema, planUnitItemSchema } from "@/application/session-plans/schemas";
import { requireRole } from "@/lib/auth-guard";

function parseUnits(raw: FormDataEntryValue | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    if (!Array.isArray(parsed)) return [];
    return parsed.map((u) => planUnitItemSchema.parse(u));
  } catch {
    return [];
  }
}

function parseFormData(fd: FormData) {
  return sessionPlanInputSchema.parse({
    groupId: fd.get("groupId") ?? "",
    sessionDate: fd.get("sessionDate") ?? "",
    units: parseUnits(fd.get("units")),
    notes: fd.get("notes") || undefined,
    isTemplate: fd.get("isTemplate") === "on",
    templateName: fd.get("templateName") || undefined,
  });
}

export async function createDraftPlanAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const data = parseFormData(formData);
    const created = await createDraftPlan(data, user.id);
    revalidatePath("/coach/session-plans");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateDraftPlanAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const data = parseFormData(formData);
    await updateDraftPlan(id, data, user.id);
    revalidatePath("/coach/session-plans");
    revalidatePath(`/coach/session-plans/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function submitPlanAction(id: string): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await submitPlan(id, user.id);
    revalidatePath("/coach/session-plans");
    revalidatePath(`/coach/session-plans/${id}`);
    revalidatePath("/head-coach/approvals");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function resubmitPlanAction(id: string): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await resubmitPlan(id, user.id);
    revalidatePath(`/coach/session-plans/${id}`);
    revalidatePath("/head-coach/approvals");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function pullBackPlanAction(id: string): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await pullBackPlan(id, user.id);
    revalidatePath(`/coach/session-plans/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function approvePlanAction(id: string): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await approvePlan(id, user.id);
    revalidatePath("/head-coach/approvals");
    revalidatePath(`/head-coach/approvals/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function rejectPlanAction(
  id: string,
  comment: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await rejectPlan(id, user.id, comment);
    revalidatePath("/head-coach/approvals");
    revalidatePath(`/head-coach/approvals/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function reviewPlanAction(
  id: string,
  action: "approve" | "reject",
  units: { trainingUnitId: string; durationOverrideSec?: number | null; roundsOverride?: number | null; notes?: string }[],
  notes: string | undefined,
  comment: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await reviewPlan(id, user.id, action, units, notes, comment);
    revalidatePath("/head-coach/approvals");
    revalidatePath(`/head-coach/approvals/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

