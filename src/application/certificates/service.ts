// Certificates service (FR-CRT-01..04).
// v1: HC reviews shortlist + manually issues; v2 auto-generates PDFs.

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import { monthRange } from "@/domain/monthly-reports/aggregate";
import {
  shortlistCoaches,
  shortlistTrainees,
  type CoachScoreInput,
  type TraineeScoreInput,
} from "@/domain/certificates/scoring";
import { dispatchNotification } from "@/application/notifications/service";
import { pdfGenerator } from "@/infrastructure/pdf/pdf";
import { storage } from "@/infrastructure/storage/storage";

export const issueCertificateSchema = z.object({
  recipientId: z.string().min(1),
  awardType: z.enum([
    "BEST_TRAINEE_GROUP",
    "BEST_TRAINEE_LOCATION",
    "BEST_COACH_LOCATION",
    "BELT_PROGRESSION",
    "CHAMPIONSHIP",
    "OTHER",
  ]),
  groupId: z.string().nullable().optional(),
  periodYear: z.coerce.number().int().min(2024).max(2099),
  periodMonth: z.coerce.number().int().min(1).max(12),
  narrative: z.string().min(3).max(1000),
  pdfUrl: z.string().url().nullable().optional(),
});

export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;

/**
 * Best Trainee shortlist for a group + period.
 * Combines attendance rate (from Attendance) and avg effort (from QuickEvaluation).
 */
export async function bestTraineeShortlistForGroup(
  groupId: string,
  year: number,
  month: number,
) {
  const { start, end } = monthRange(year, month);
  const enrollments = await prisma.enrollment.findMany({
    where: { groupId, status: "ACTIVE" },
    select: {
      traineeId: true,
      trainee: { select: { fullNameEn: true, fullNameAr: true } },
    },
  });

  const inputs: (TraineeScoreInput & { fullNameEn: string; fullNameAr: string })[] = [];
  for (const enr of enrollments) {
    const [attRows, effortRows] = await Promise.all([
      prisma.attendance.findMany({
        where: {
          traineeId: enr.traineeId,
          session: { groupId, scheduledStart: { gte: start, lt: end } },
        },
        select: { status: true },
      }),
      prisma.quickEvaluation.findMany({
        where: {
          traineeId: enr.traineeId,
          session: { groupId, scheduledStart: { gte: start, lt: end } },
        },
        select: { effortScore: true },
      }),
    ]);
    const total = attRows.length;
    const attended = attRows.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const averageEffort =
      effortRows.length === 0
        ? null
        : effortRows.reduce((s, r) => s + r.effortScore, 0) / effortRows.length;
    inputs.push({
      traineeId: enr.traineeId,
      attendanceRate: total === 0 ? 0 : attended / total,
      averageEffort,
      sessionsCompleted: attended,
      fullNameEn: enr.trainee.fullNameEn,
      fullNameAr: enr.trainee.fullNameAr,
    });
  }

  const ranked = shortlistTrainees(inputs);
  const byId = new Map(inputs.map((i) => [i.traineeId, i]));
  return ranked.map((s) => ({
    ...s,
    fullNameEn: byId.get(s.traineeId)?.fullNameEn ?? "",
    fullNameAr: byId.get(s.traineeId)?.fullNameAr ?? "",
  }));
}

/**
 * Best Coach shortlist for a location + period.
 */
export async function bestCoachShortlistForLocation(
  locationId: string,
  year: number,
  month: number,
) {
  const { start, end } = monthRange(year, month);
  const coaches = await prisma.user.findMany({
    where: {
      role: "COACH",
      status: "ACTIVE",
      sessionsAsCoach: { some: { locationId, scheduledStart: { gte: start, lt: end } } },
    },
    select: { id: true, fullNameEn: true, fullNameAr: true },
  });

  const inputs: (CoachScoreInput & { fullNameEn: string; fullNameAr: string })[] = [];
  for (const c of coaches) {
    const sessions = await prisma.session.findMany({
      where: {
        coachId: c.id,
        locationId,
        scheduledStart: { gte: start, lt: end },
      },
      select: {
        id: true,
        quickEvaluations: { select: { effortScore: true } },
        dailyReport: { select: { id: true, status: true, reviewedAt: true, submittedAt: true } },
      },
    });
    const allEffort = sessions.flatMap((s) => s.quickEvaluations.map((q) => q.effortScore));
    const reportsTotal = sessions.filter((s) => !!s.dailyReport).length;
    const reportsApprovedFirstTry = sessions.filter(
      (s) => s.dailyReport?.status === "APPROVED",
    ).length;
    inputs.push({
      coachId: c.id,
      sessionsRun: sessions.length,
      averageGroupEffort:
        allEffort.length === 0
          ? null
          : allEffort.reduce((s, n) => s + n, 0) / allEffort.length,
      reportsApprovedFirstTry,
      reportsTotal,
      fullNameEn: c.fullNameEn,
      fullNameAr: c.fullNameAr,
    });
  }

  const ranked = shortlistCoaches(inputs);
  const byId = new Map(inputs.map((i) => [i.coachId, i]));
  return ranked.map((s) => ({
    ...s,
    fullNameEn: byId.get(s.coachId)?.fullNameEn ?? "",
    fullNameAr: byId.get(s.coachId)?.fullNameAr ?? "",
  }));
}

export async function issueCertificate(input: IssueCertificateInput, actorId: string) {
  const data = issueCertificateSchema.parse(input);

  // Resolve recipient + issuer names for the PDF (only if we'll auto-generate).
  const willGeneratePdf = !data.pdfUrl;
  const [recipient, issuer] = willGeneratePdf
    ? await Promise.all([
        prisma.user.findUnique({
          where: { id: data.recipientId },
          select: { fullNameEn: true },
        }),
        prisma.user.findUnique({
          where: { id: actorId },
          select: { fullNameEn: true },
        }),
      ])
    : [null, null];

  const created = await prisma.certificate.create({
    data: {
      recipientId: data.recipientId,
      awardType: data.awardType,
      groupId: data.groupId ?? null,
      periodYear: data.periodYear,
      periodMonth: data.periodMonth,
      narrative: data.narrative,
      issuedById: actorId,
      pdfUrl: data.pdfUrl ?? null,
    },
  });

  // FR-CRT-03 v2 path: auto-render the CSK-branded PDF when one wasn't supplied.
  if (willGeneratePdf && recipient && issuer) {
    const periodLabel = new Date(data.periodYear, data.periodMonth - 1, 1).toLocaleString("en", {
      month: "long",
      year: "numeric",
    });
    const buffer = await pdfGenerator.certificate({
      recipientName: recipient.fullNameEn,
      awardTitle: prettyAwardName(data.awardType),
      narrative: data.narrative,
      periodLabel,
      issuedByName: issuer.fullNameEn,
      issuedDate: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    });
    const stored = await storage.put({
      scope: "certificate",
      key: `${created.id}.pdf`,
      contentType: "application/pdf",
      data: buffer,
    });
    await prisma.certificate.update({
      where: { id: created.id },
      data: { pdfUrl: stored.url },
    });
    created.pdfUrl = stored.url;
  }

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "certificate.issue",
      entityType: "Certificate",
      entityId: created.id,
      changes: {
        awardType: data.awardType,
        recipient: data.recipientId,
        autoPdf: willGeneratePdf,
      },
    },
  });
  await dispatchNotification({
    recipientUserId: data.recipientId,
    eventType: "BEST_TRAINEE_AWARD",
    payload: {
      awardName: prettyAwardName(data.awardType),
      narrative: data.narrative,
      pdfUrl: created.pdfUrl,
    },
  });
  return created;
}

export async function listCertificatesForUser(userId: string) {
  return prisma.certificate.findMany({
    where: { recipientId: userId },
    orderBy: { issuedAt: "desc" },
    include: {
      group: { select: { name: true } },
      issuedBy: { select: { fullNameEn: true } },
    },
  });
}

export async function listAllCertificates(year?: number, month?: number) {
  return prisma.certificate.findMany({
    where: {
      periodYear: year,
      periodMonth: month,
    },
    orderBy: { issuedAt: "desc" },
    include: {
      recipient: { select: { id: true, fullNameEn: true, fullNameAr: true, role: true } },
      group: { select: { name: true } },
      issuedBy: { select: { fullNameEn: true } },
    },
  });
}

function prettyAwardName(t: IssueCertificateInput["awardType"]): string {
  switch (t) {
    case "BEST_TRAINEE_GROUP":
      return "Best Trainee — Group";
    case "BEST_TRAINEE_LOCATION":
      return "Best Trainee — Location";
    case "BEST_COACH_LOCATION":
      return "Best Coach — Location";
    case "BELT_PROGRESSION":
      return "Belt Progression";
    case "CHAMPIONSHIP":
      return "Championship";
    case "OTHER":
      return "CSK Award";
  }
}
