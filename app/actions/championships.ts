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
  registerExternalAcademyAndCoach,
  registerExternalFighter,
  submitInstapayPayment,
  verifyInstapayPayment,
  runAutomatedMatchmaking,
  recordMatchResult,
} from "@/application/championships/service";
import {
  externalSignupSchema,
  fighterRegisterSchema,
  instapayPaymentSchema,
  matchResultSchema,
} from "@/application/championships/schemas";
import { requireRole } from "@/lib/auth-guard";
import { auth, signIn } from "@/auth";
import { storage } from "@/infrastructure/storage/storage";

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

export async function registerExternalAcademyAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const data = externalSignupSchema.parse({
      fullNameAr: formData.get("fullNameAr"),
      fullNameEn: formData.get("fullNameEn"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      password: formData.get("password"),
      academyNameAr: formData.get("academyNameAr"),
      academyNameEn: formData.get("academyNameEn"),
    });

    await registerExternalAcademyAndCoach(data);

    // Auto sign-in
    await signIn("credentials", {
      identifier: data.email,
      password: data.password,
      redirect: false,
    });

    revalidatePath("/coach");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function registerFighterAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");

    // Upload photo if present
    const photoFile = formData.get("photo") as File | null;
    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const bytes = await photoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const extension = photoFile.name.split(".").pop() || "";
      const cleanName = photoFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^A-Za-z0-9_-]/g, "");
      const key = `${Date.now()}-${cleanName}.${extension}`.replace(/[^A-Za-z0-9._-]/g, "");
      const stored = await storage.put({
        scope: "profile-photo",
        key,
        contentType: photoFile.type,
        data: buffer,
      });
      photoUrl = stored.url;
    }

    const data = fighterRegisterSchema.parse({
      championshipId: formData.get("championshipId"),
      fullNameAr: formData.get("fullNameAr"),
      fullNameEn: formData.get("fullNameEn"),
      phone: formData.get("phone"),
      gender: formData.get("gender"),
      dob: formData.get("dob"),
      weightKg: formData.get("weightKg"),
      fightClass: formData.get("fightClass"),
      photoUrl: photoUrl || formData.get("photoUrl") || null,
    });

    await registerExternalFighter(data, user.id);
    revalidatePath("/coach");
    revalidatePath(`/coach/championships/${data.championshipId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function submitInstapayPaymentAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) throw new Error("Not signed in");

    // Upload receipt if present
    const receiptFile = formData.get("receipt") as File | null;
    let paymentReceiptUrl: string | null = null;
    if (receiptFile && receiptFile.size > 0) {
      const bytes = await receiptFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const extension = receiptFile.name.split(".").pop() || "";
      const cleanName = receiptFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^A-Za-z0-9_-]/g, "");
      const key = `${Date.now()}-${cleanName}.${extension}`.replace(/[^A-Za-z0-9._-]/g, "");
      const stored = await storage.put({
        scope: "medical-document", // using medical-document scope for confirmation papers
        key,
        contentType: receiptFile.type,
        data: buffer,
      });
      paymentReceiptUrl = stored.url;
    }

    const data = instapayPaymentSchema.parse({
      registrationId: formData.get("registrationId"),
      instapayRef: formData.get("instapayRef"),
      paymentReceiptUrl: paymentReceiptUrl || formData.get("paymentReceiptUrl") || null,
    });

    await submitInstapayPayment(data, session.user.id);
    revalidatePath("/coach");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function verifyPaymentAction(
  registrationId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await verifyInstapayPayment(registrationId, user.id);
    revalidatePath("/head-coach/championships");
    revalidatePath("/admin/championships");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function runMatchmakingAction(
  championshipId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await runAutomatedMatchmaking(championshipId, user.id);
    revalidatePath("/head-coach/championships");
    revalidatePath(`/championships/${championshipId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function recordMatchResultAction(
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const data = matchResultSchema.parse({
      matchId: formData.get("matchId"),
      outcome: formData.get("outcome"),
      method: formData.get("method") || null,
      round: formData.get("round") || null,
      timeInRound: formData.get("timeInRound") || null,
      videoUrl: formData.get("videoUrl") || null,
      notes: formData.get("notes") || null,
      winnerId: formData.get("winnerId") || null,
    });
    await recordMatchResult(data, user.id);
    revalidatePath("/head-coach/championships");
    revalidatePath(`/championships/${formData.get("championshipId")}`);
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
