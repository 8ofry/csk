"use server";

import { revalidatePath } from "next/cache";
import {
  addMedicalDocument,
  archiveMedicalDocument,
  medicalDocumentSchema,
  medicalRecordSchema,
  upsertTraineeMedicalRecord,
} from "@/application/medical/service";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";

async function requireAuthed() {
  const session = await auth();
  if (!session?.user) throw new Error("Not signed in");
  return session.user;
}

/** Trainee saves their own record, or HC saves on behalf of any trainee. */
export async function saveMedicalRecordAction(
  traineeId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireAuthed();
    const isOwnerOrParent =
      user.id === traineeId; // Parent flow expanded once parent_user_id linkage is wired in UI.
    const isStaff = user.role === "ADMIN" || user.role === "HEAD_COACH";
    if (!isOwnerOrParent && !isStaff) throw new Error("Forbidden");

    const data = medicalRecordSchema.parse({
      bloodType: formData.get("bloodType") || null,
      allergies: formData.get("allergies") || null,
      chronicConditions: formData.get("chronicConditions") || null,
      currentMedications: formData.get("currentMedications") || null,
      primaryPhysicianName: formData.get("primaryPhysicianName") || null,
      primaryPhysicianPhone: formData.get("primaryPhysicianPhone") || null,
      emergencyContactName: formData.get("emergencyContactName") || null,
      emergencyContactPhone: formData.get("emergencyContactPhone") || null,
      emergencyContactRelation: formData.get("emergencyContactRelation") || null,
    });
    await upsertTraineeMedicalRecord(traineeId, data, user.id);
    revalidatePath("/trainee/medical");
    revalidatePath("/head-coach/medical");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function addMedicalDocumentAction(
  traineeId: string,
  formData: FormData,
): Promise<{ ok?: true; id?: string; error?: string }> {
  try {
    const user = await requireAuthed();
    const isOwner = user.id === traineeId;
    const isStaff = user.role === "ADMIN" || user.role === "HEAD_COACH";
    if (!isOwner && !isStaff) throw new Error("Forbidden");

    const data = medicalDocumentSchema.parse({
      documentType: formData.get("documentType"),
      fileUrl: formData.get("fileUrl"),
      issueDate: formData.get("issueDate"),
      expiryDate: formData.get("expiryDate"),
      issuingDoctor: formData.get("issuingDoctor") || null,
      notes: formData.get("notes") || null,
    });
    const created = await addMedicalDocument(traineeId, data, user.id);
    revalidatePath("/trainee/medical");
    revalidatePath("/head-coach/medical");
    return { ok: true, id: created.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function archiveMedicalDocumentAction(
  documentId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await archiveMedicalDocument(documentId, user.id);
    revalidatePath("/head-coach/medical");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
