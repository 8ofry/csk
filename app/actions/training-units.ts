"use server";

import { revalidatePath } from "next/cache";
import {
  archiveTrainingUnit,
  createTrainingUnit,
  updateTrainingUnit,
} from "@/application/training-units/service";
import { trainingUnitInputSchema } from "@/application/training-units/schemas";
import { requireRole } from "@/lib/auth-guard";

function parseList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFormData(fd: FormData) {
  return trainingUnitInputSchema.parse({
    nameAr: fd.get("nameAr") ?? "",
    nameEn: fd.get("nameEn") ?? "",
    descriptionAr: fd.get("descriptionAr") || null,
    descriptionEn: fd.get("descriptionEn") || null,
    category: fd.get("category") ?? "technique",
    disciplineIds: fd.getAll("disciplineIds").map(String),
    targetBodyParts: fd.getAll("targetBodyParts").map(String),
    targetSkills: parseList(fd.get("targetSkills")),
    difficulty: fd.get("difficulty") ?? 1,
    recommendedDurationSeconds: fd.get("recommendedDurationSeconds") || null,
    recommendedRounds: fd.get("recommendedRounds") || null,
    recommendedRoundDurationSec: fd.get("recommendedRoundDurationSec") || null,
    equipmentRequired: parseList(fd.get("equipmentRequired")),
    demoMediaUrl: fd.get("demoMediaUrl") || null,
    demoMediaType: fd.get("demoMediaType") || null,
    published: fd.get("published") === "on" || fd.get("published") === "true",
  });
}

export async function createTrainingUnitAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseFormData(formData);
    const created = await createTrainingUnit(data, user.id);
    revalidatePath("/head-coach/training-units");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateTrainingUnitAction(
  id: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = parseFormData(formData);
    const changeNote = String(formData.get("changeNote") ?? "") || undefined;
    await updateTrainingUnit(id, data, user.id, changeNote);
    revalidatePath("/head-coach/training-units");
    revalidatePath(`/head-coach/training-units/${id}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function archiveTrainingUnitAction(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await archiveTrainingUnit(id, user.id);
    revalidatePath("/head-coach/training-units");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
