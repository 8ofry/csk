// Monthly performance reports (FR-MR-01..05).
// Aggregates the previous month for each trainee. Manual trigger in v1;
// the same `generateForTrainee` is what the future scheduled job will call (FR-MR-01).

import { prisma } from "@/infrastructure/db/prisma";
import {
  monthRange,
  summarize,
  type AttendanceRow,
  type QuickEvalRow,
} from "@/domain/monthly-reports/aggregate";
import { pdfGenerator } from "@/infrastructure/pdf/pdf";
import { storage } from "@/infrastructure/storage/storage";
import { dispatchNotification } from "@/application/notifications/service";
import { latestDetailedEvaluation } from "@/application/evaluations/detailed-eval-service";

export interface GenerateInput {
  traineeId: string;
  year: number;
  month: number; // 1..12
}

export async function generateForTrainee(input: GenerateInput, actorId: string) {
  const { traineeId, year, month } = input;
  const { start, end } = monthRange(year, month);

  const trainee = await prisma.user.findUnique({
    where: { id: traineeId },
    select: { id: true, fullNameEn: true, fullNameAr: true, role: true },
  });
  if (!trainee || trainee.role !== "TRAINEE") {
    throw new Error("Trainee not found");
  }

  const [attendances, quickEvals, latestDetailed, beltExams, championships] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        traineeId,
        session: { scheduledStart: { gte: start, lt: end } },
      },
      select: { status: true },
    }),
    prisma.quickEvaluation.findMany({
      where: {
        traineeId,
        createdAt: { gte: start, lt: end },
      },
      select: { effortScore: true, createdAt: true },
    }),
    latestDetailedEvaluation(traineeId),
    prisma.beltExamResult.findMany({
      where: { traineeId, recordedAt: { gte: start, lt: end } },
      include: { exam: { select: { discipline: { select: { nameEn: true } } } } },
    }),
    prisma.championshipRegistration.findMany({
      where: {
        traineeId,
        confirmedAt: { gte: start, lt: end },
      },
      include: { championship: { select: { name: true, startDate: true } } },
    }),
  ]);

  const summary = summarize(
    attendances.map((a): AttendanceRow => ({ status: a.status })),
    quickEvals.map((q): QuickEvalRow => ({ effortScore: q.effortScore, createdAt: q.createdAt })),
  );

  const milestones: { type: string; label: string; date: string }[] = [];
  for (const r of beltExams) {
    if (r.result === "PASSED") {
      milestones.push({
        type: "belt",
        label: `Belt exam passed — ${r.exam.discipline.nameEn} → level ${r.newLevel ?? ""}`,
        date: r.recordedAt.toISOString().slice(0, 10),
      });
    }
  }
  for (const c of championships) {
    milestones.push({
      type: "championship",
      label: `Confirmed for ${c.championship.name}`,
      date: (c.confirmedAt ?? c.championship.startDate).toISOString().slice(0, 10),
    });
  }
  const reportData = {
    attendance: summary.attendance,
    averageEffort: summary.averageEffort,
    effortTrend: summary.effortTrend,
    latestDetailedEvalId: latestDetailed?.id ?? null,
  };

  // Cast through unknown at the persistence boundary: domain types use strict
  // shapes; Prisma JSON columns expect its loose InputJsonValue.
  const attendanceJson = summary.attendance as unknown as object;
  const evaluationJson = reportData as unknown as object;
  const milestonesJson = milestones as unknown as object;

  // Upsert MonthlyReport row (one per trainee/year/month)
  const report = await prisma.monthlyReport.upsert({
    where: {
      traineeId_periodYear_periodMonth: { traineeId, periodYear: year, periodMonth: month },
    },
    create: {
      traineeId,
      periodYear: year,
      periodMonth: month,
      attendanceSummary: attendanceJson,
      evaluationSummary: evaluationJson,
      milestones: milestonesJson,
      status: "DRAFT",
    },
    update: {
      attendanceSummary: attendanceJson,
      evaluationSummary: evaluationJson,
      milestones: milestonesJson,
      generatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "monthly-report.generate",
      entityType: "MonthlyReport",
      entityId: report.id,
      changes: { period: `${year}-${month}` },
    },
  });

  return report;
}

export async function approveAndDeliver(
  reportId: string,
  approvedById: string,
  appUrl: string,
) {
  const report = await prisma.monthlyReport.findUnique({
    where: { id: reportId },
    include: { trainee: { select: { id: true, fullNameEn: true } } },
  });
  if (!report) throw new Error("Report not found");
  if (report.status === "DELIVERED") return report;

  // Derive a representative group for the PDF context (most-attended group this month)
  const enrollments = await prisma.enrollment.findMany({
    where: { traineeId: report.traineeId, status: "ACTIVE" },
    include: { group: { select: { name: true } } },
    take: 1,
  });
  const groupName = enrollments[0]?.group.name ?? "—";
  const periodLabel = new Date(report.periodYear, report.periodMonth - 1, 1).toLocaleString("en", {
    month: "long",
    year: "numeric",
  });

  const evalSummary = report.evaluationSummary as {
    attendance: { total: number; present: number; late: number; absent: number; excused: number; rate: number };
    averageEffort: number | null;
  };

  const buffer = await pdfGenerator.monthlyReport({
    traineeName: report.trainee.fullNameEn,
    groupName,
    periodLabel,
    attendance: evalSummary.attendance,
    averageEffort: evalSummary.averageEffort,
    narrative: report.narrative ?? undefined,
    milestones: (report.milestones as { type: string; label: string; date: string }[]) ?? [],
  });
  const stored = await storage.put({
    scope: "monthly-report",
    key: `${reportId}.pdf`,
    contentType: "application/pdf",
    data: buffer,
  });

  const updated = await prisma.monthlyReport.update({
    where: { id: reportId },
    data: {
      status: "DELIVERED",
      approvedById,
      approvedAt: new Date(),
      deliveredAt: new Date(),
      pdfUrl: stored.url,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: approvedById,
      action: "monthly-report.approve-deliver",
      entityType: "MonthlyReport",
      entityId: reportId,
    },
  });

  await dispatchNotification({
    recipientUserId: report.traineeId,
    eventType: "MONTHLY_REPORT_READY",
    payload: {
      periodLabel,
      pdfUrl: `${appUrl}${stored.url}`,
      appUrl,
    },
  });

  return updated;
}

export async function listReportsForApproval() {
  return prisma.monthlyReport.findMany({
    where: { status: "DRAFT" },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
    include: {
      trainee: { select: { fullNameEn: true, fullNameAr: true } },
    },
  });
}

export async function getMonthlyReport(id: string) {
  return prisma.monthlyReport.findUnique({
    where: { id },
    include: { trainee: true, approvedBy: { select: { fullNameEn: true } } },
  });
}
