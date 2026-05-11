// Medical records & documents service (FR-MED-01..05).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { storage } from "@/infrastructure/storage/storage";
import {
  evaluateClearance,
  type MedicalDoc,
} from "@/domain/medical/clearance";

export const medicalRecordSchema = z.object({
  bloodType: z.string().max(10).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
  chronicConditions: z.string().max(2000).optional().nullable(),
  currentMedications: z.string().max(2000).optional().nullable(),
  primaryPhysicianName: z.string().max(200).optional().nullable(),
  primaryPhysicianPhone: z.string().max(40).optional().nullable(),
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(40).optional().nullable(),
  emergencyContactRelation: z.string().max(80).optional().nullable(),
});

export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;

export const medicalDocumentSchema = z.object({
  documentType: z.enum(["CLEARANCE", "ECG", "BLOOD", "VISION", "OTHER"]),
  fileUrl: z.string().url(),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  issuingDoctor: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type MedicalDocumentInput = z.infer<typeof medicalDocumentSchema>;

export async function getTraineeMedical(traineeId: string) {
  const [record, documents] = await Promise.all([
    prisma.medicalRecord.findUnique({ where: { traineeId } }),
    prisma.medicalDocument.findMany({
      where: { traineeId },
      orderBy: { expiryDate: "desc" },
    }),
  ]);
  return { record, documents };
}

export async function upsertTraineeMedicalRecord(
  traineeId: string,
  input: MedicalRecordInput,
  actorId: string,
) {
  const data = medicalRecordSchema.parse(input);
  const upserted = await prisma.medicalRecord.upsert({
    where: { traineeId },
    create: {
      traineeId,
      bloodType: data.bloodType ?? null,
      allergies: data.allergies ?? null,
      chronicConditions: data.chronicConditions ?? null,
      currentMedications: data.currentMedications ?? null,
      primaryPhysicianName: data.primaryPhysicianName ?? null,
      primaryPhysicianPhone: data.primaryPhysicianPhone ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      emergencyContactRelation: data.emergencyContactRelation ?? null,
    },
    update: {
      bloodType: data.bloodType ?? null,
      allergies: data.allergies ?? null,
      chronicConditions: data.chronicConditions ?? null,
      currentMedications: data.currentMedications ?? null,
      primaryPhysicianName: data.primaryPhysicianName ?? null,
      primaryPhysicianPhone: data.primaryPhysicianPhone ?? null,
      emergencyContactName: data.emergencyContactName ?? null,
      emergencyContactPhone: data.emergencyContactPhone ?? null,
      emergencyContactRelation: data.emergencyContactRelation ?? null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "medical-record.upsert",
      entityType: "MedicalRecord",
      entityId: upserted.id,
    },
  });
  return upserted;
}

export async function addMedicalDocument(
  traineeId: string,
  input: MedicalDocumentInput,
  actorId: string,
) {
  const data = medicalDocumentSchema.parse(input);
  await storage.acceptUrl({ scope: "medical-document", url: data.fileUrl });

  const created = await prisma.medicalDocument.create({
    data: {
      traineeId,
      documentType: data.documentType,
      fileUrl: data.fileUrl,
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      issuingDoctor: data.issuingDoctor ?? null,
      notes: data.notes ?? null,
      status: data.expiryDate <= new Date() ? "EXPIRED" : "ACTIVE",
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "medical-document.add",
      entityType: "MedicalDocument",
      entityId: created.id,
      changes: { type: data.documentType, expiryDate: data.expiryDate.toISOString() },
    },
  });
  return created;
}

export async function archiveMedicalDocument(documentId: string, actorId: string) {
  const updated = await prisma.medicalDocument.update({
    where: { id: documentId },
    data: { status: "EXPIRED" },
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "medical-document.archive",
      entityType: "MedicalDocument",
      entityId: documentId,
    },
  });
  return updated;
}

export async function isTraineeCleared(traineeId: string): Promise<boolean> {
  const docs = await prisma.medicalDocument.findMany({
    where: { traineeId, status: "ACTIVE" },
    select: { id: true, documentType: true, expiryDate: true, status: true },
  });
  const result = evaluateClearance(
    docs.map(
      (d): MedicalDoc => ({
        id: d.id,
        documentType: d.documentType,
        expiryDate: d.expiryDate,
        status: d.status,
      }),
    ),
  );
  return result.cleared;
}

/** All documents expiring within `daysAhead` days, sorted by soonest first. */
export async function listExpiring(daysAhead = 30) {
  const now = new Date();
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return prisma.medicalDocument.findMany({
    where: {
      status: "ACTIVE",
      expiryDate: { lte: cutoff },
    },
    orderBy: { expiryDate: "asc" },
    include: {
      trainee: {
        select: { id: true, fullNameEn: true, fullNameAr: true, parentManaged: true },
      },
    },
  });
}
