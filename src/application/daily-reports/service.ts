// Daily Report service (FR-DR-01..05).
// On approval, fan out notifications to trainees/parents (FR-DR-05).

import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";
import {
  DailyReportTransitionError,
  canApproveDailyReport,
  canEditDailyReport,
  nextDailyReportStatus,
  type DailyReportStatus,
} from "@/domain/daily-reports/state";
import { dispatchNotification } from "@/application/notifications/service";

export const dailyReportInputSchema = z.object({
  summary: z.string().min(1).max(2000),
  incidents: z.string().max(2000).optional(),
});

export type DailyReportInput = z.infer<typeof dailyReportInputSchema>;

export class DailyReportAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyReportAuthorizationError";
  }
}

/** Idempotently create a DRAFT daily report for a session, or return the existing one. */
export async function ensureDailyReport(sessionId: string, coachId: string) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { dailyReport: true },
  });
  if (!session) throw new DailyReportAuthorizationError("Session not found");
  if (session.coachId !== coachId) throw new DailyReportAuthorizationError("Not your session");

  if (session.dailyReport) return session.dailyReport;

  return prisma.dailyReport.create({
    data: {
      sessionId,
      groupId: session.groupId,
      coachId,
      status: "DRAFT",
    },
  });
}

export async function getDailyReportBySessionId(sessionId: string) {
  return prisma.dailyReport.findUnique({
    where: { sessionId },
    include: {
      reviewedBy: { select: { id: true, fullNameEn: true } },
      coach: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      group: { select: { id: true, name: true, location: { select: { nameEn: true } } } },
    },
  });
}

export async function listPendingDailyReports() {
  return prisma.dailyReport.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: {
      coach: { select: { fullNameEn: true } },
      group: { select: { name: true, location: { select: { nameEn: true } } } },
    },
  });
}

export async function listOverdueDailyReports() {
  // FR-DR-04: approval deadline is end of next day; overdue = submitted >24h ago.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return prisma.dailyReport.findMany({
    where: { status: "PENDING", submittedAt: { lt: cutoff } },
    orderBy: { submittedAt: "asc" },
    include: {
      coach: { select: { fullNameEn: true } },
      group: { select: { name: true, location: { select: { nameEn: true } } } },
    },
  });
}

export async function updateDailyReport(
  reportId: string,
  input: DailyReportInput,
  coachId: string,
) {
  const data = dailyReportInputSchema.parse(input);
  const before = await assertCoachOwns(reportId, coachId);
  if (!canEditDailyReport(before.status as DailyReportStatus)) {
    throw new DailyReportTransitionError(
      `Reports in ${before.status} state cannot be edited`,
    );
  }
  const updated = await prisma.dailyReport.update({
    where: { id: reportId },
    data: { summary: data.summary, incidents: data.incidents ?? null },
  });
  await prisma.auditLog.create({
    data: {
      actorId: coachId,
      action: "daily-report.update",
      entityType: "DailyReport",
      entityId: reportId,
    },
  });
  return updated;
}

export async function submitDailyReport(reportId: string, coachId: string) {
  const before = await assertCoachOwns(reportId, coachId);
  const status = nextDailyReportStatus(before.status as DailyReportStatus, "submit");
  return transition(reportId, status, {
    actorId: coachId,
    action: "submit",
    extra: { submittedAt: new Date() },
  });
}

export async function resubmitDailyReport(reportId: string, coachId: string) {
  const before = await assertCoachOwns(reportId, coachId);
  const status = nextDailyReportStatus(before.status as DailyReportStatus, "resubmit");
  return transition(reportId, status, {
    actorId: coachId,
    action: "resubmit",
    extra: { submittedAt: new Date() },
  });
}

export async function pullBackDailyReport(reportId: string, coachId: string) {
  const before = await assertCoachOwns(reportId, coachId);
  const status = nextDailyReportStatus(before.status as DailyReportStatus, "pull-back");
  return transition(reportId, status, { actorId: coachId, action: "pull-back" });
}

export async function approveDailyReport(reportId: string, headCoachId: string, appUrl: string) {
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
      session: {
        include: {
          attendances: { include: { trainee: { select: { id: true } } } },
          group: { select: { name: true } },
        },
      },
    },
  });
  if (!report) throw new DailyReportAuthorizationError("Report not found");
  if (!canApproveDailyReport(report.status as DailyReportStatus)) {
    throw new DailyReportTransitionError(
      `Daily report must be PENDING to approve (got ${report.status})`,
    );
  }

  const status = nextDailyReportStatus(report.status as DailyReportStatus, "approve");
  const updated = await transition(reportId, status, {
    actorId: headCoachId,
    action: "approve",
    extra: { reviewedById: headCoachId, reviewedAt: new Date(), deliveredAt: new Date() },
  });

  // FR-DR-05: deliver to each trainee that was marked attended (PRESENT/LATE)
  const eligible = report.session.attendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE",
  );
  for (const a of eligible) {
    await dispatchNotification({
      recipientUserId: a.trainee.id,
      eventType: "DAILY_REPORT_READY",
      payload: {
        groupName: report.session.group.name,
        traineeName: "", // Could be enriched per recipient
        url: `${appUrl}/trainee/reports`,
      },
    });
  }

  return updated;
}

export async function rejectDailyReport(
  reportId: string,
  headCoachId: string,
  comment: string,
) {
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
      coach: { select: { id: true } },
      group: { select: { name: true } },
    },
  });
  if (!report) throw new DailyReportAuthorizationError("Report not found");
  const status = nextDailyReportStatus(report.status as DailyReportStatus, "reject", {
    rejectionComment: comment,
  });
  const updated = await transition(reportId, status, {
    actorId: headCoachId,
    action: "reject",
    extra: { reviewedById: headCoachId, reviewedAt: new Date(), rejectionReason: comment },
  });

  // Notify the coach (FR-NOT channel matrix: "Daily report needs revision (coach)")
  await dispatchNotification({
    recipientUserId: report.coach.id,
    eventType: "DAILY_REPORT_NEEDS_REVISION",
    payload: { groupName: report.group.name, comment },
  });

  return updated;
}

interface TransitionOpts {
  actorId: string;
  action: string;
  extra?: Partial<{
    submittedAt: Date;
    reviewedById: string;
    reviewedAt: Date;
    deliveredAt: Date;
    rejectionReason: string;
  }>;
}

async function transition(reportId: string, status: DailyReportStatus, opts: TransitionOpts) {
  const updated = await prisma.dailyReport.update({
    where: { id: reportId },
    data: { status, ...opts.extra },
  });
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: `daily-report.${opts.action}`,
      entityType: "DailyReport",
      entityId: reportId,
      changes: { status },
    },
  });
  return updated;
}

async function assertCoachOwns(reportId: string, coachId: string) {
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    select: { coachId: true, status: true },
  });
  if (!report) throw new DailyReportAuthorizationError("Report not found");
  if (report.coachId !== coachId)
    throw new DailyReportAuthorizationError("Not your report");
  return report;
}
