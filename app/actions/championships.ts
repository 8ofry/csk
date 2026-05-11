"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  championshipInputSchema,
  coachConfirmRegistration,
  createChampionship,
  fightResultInputSchema,
  optInTrainee,
  recordFightResult,
  withdrawRegistration,
} from "@/application/championships/service";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";

/** Void-returning shim for use as a server `<form action>`. */
export async function createChampionshipFormAction(formData: FormData): Promise<void> {
  await createChampionshipAction(formData);
}

export async function createChampionshipAction(
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const data = championshipInputSchema.parse({
      name: formData.get("name"),
      organizer: formData.get("organizer"),
      isOfficial: formData.get("isOfficial") === "on",
      locationLabel: formData.get("locationLabel"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      disciplineIds: formData.getAll("disciplineIds").map(String),
      weightCategories: parseList(formData.get("weightCategories")),
      ageCategories: parseList(formData.get("ageCategories")),
      allowedLevels: formData.getAll("allowedLevels").map(String) as ("N" | "A" | "B" | "C")[],
      registrationDeadline: formData.get("registrationDeadline"),
      registrationFee: formData.get("registrationFee"),
      notes: formData.get("notes") || null,
    });
    const created = await createChampionship(data, user.id);
    revalidatePath("/head-coach/championships");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

const optInSchema = z.object({
  championshipId: z.string().min(1),
  weightKg: z.coerce.number().min(20).max(250).optional().nullable(),
  level: z.enum(["N", "A", "B", "C"]).optional().nullable(),
  targetWeightClass: z.string().optional().nullable(),
  weightCutNotes: z.string().optional().nullable(),
  isAmateur: z.boolean().default(true),
});

export async function optInChampionshipAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "TRAINEE") throw new Error("Trainees only");
    const data = optInSchema.parse({
      championshipId: formData.get("championshipId"),
      weightKg: formData.get("weightKg") || null,
      level: formData.get("level") || null,
      targetWeightClass: formData.get("targetWeightClass") || null,
      weightCutNotes: formData.get("weightCutNotes") || null,
      isAmateur: formData.get("isAmateur") !== "false",
    });
    await optInTrainee({
      championshipId: data.championshipId,
      traineeId: session.user.id,
      weightKg: data.weightKg ?? null,
      level: data.level ?? null,
      targetWeightClass: data.targetWeightClass ?? null,
      weightCutNotes: data.weightCutNotes ?? null,
      isAmateur: data.isAmateur,
      actorId: session.user.id,
    });
    revalidatePath("/trainee/championships");
    revalidatePath(`/head-coach/championships/${data.championshipId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function confirmRegistrationAction(
  registrationId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await coachConfirmRegistration({ registrationId, actorId: user.id });
    revalidatePath("/head-coach/championships");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function withdrawRegistrationAction(
  registrationId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Not signed in");
    await withdrawRegistration({ registrationId, actorId: session.user.id });
    revalidatePath("/trainee/championships");
    revalidatePath("/head-coach/championships");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function recordFightResultAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const data = fightResultInputSchema.parse({
      registrationId: formData.get("registrationId"),
      opponentName: formData.get("opponentName"),
      outcome: formData.get("outcome"),
      method: formData.get("method") || null,
      round: formData.get("round") || null,
      timeInRound: formData.get("timeInRound") || null,
      videoUrl: formData.get("videoUrl") || null,
      notes: formData.get("notes") || null,
    });
    await recordFightResult(data, user.id);
    revalidatePath("/head-coach/championships");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

function parseList(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
