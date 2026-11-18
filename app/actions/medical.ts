"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import {
  addMedicalDocument,
  archiveMedicalDocument,
  medicalDocumentSchema,
  medicalRecordSchema,
  upsertTraineeMedicalRecord,
} from "@/application/medical/service";
import { requireRole } from "@/lib/auth-guard";
import { auth } from "@/auth";
import { storage, validateUploadedFile } from "@/infrastructure/storage/storage";

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
    revalidateLocalized("/trainee/medical");
    revalidateLocalized("/head-coach/medical");
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

    let fileUrl = String(formData.get("fileUrl") ?? "").trim();
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const validated = await validateUploadedFile(file, {
        maxBytes: 10 * 1024 * 1024,
        allowPdf: true,
      });
      const stored = await storage.put({
        scope: "medical-document",
        key: `${traineeId}-${Date.now()}.${validated.ext}`,
        contentType: validated.contentType,
        data: validated.buffer,
      });
      fileUrl = stored.url;
    }

    const data = medicalDocumentSchema.parse({
      documentType: formData.get("documentType"),
      fileUrl,
      issueDate: formData.get("issueDate"),
      expiryDate: formData.get("expiryDate"),
      issuingDoctor: formData.get("issuingDoctor") || null,
      notes: formData.get("notes") || null,
    });
    const created = await addMedicalDocument(traineeId, data, user.id);
    revalidateLocalized("/trainee/medical");
    revalidateLocalized("/head-coach/medical");
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
    revalidateLocalized("/head-coach/medical");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
