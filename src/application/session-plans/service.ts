// Session Plans service (FR-SES-01..06).
//  - Coach drafts and submits; Head Coach approves/rejects.
//  - State transitions enforced by domain/session-plans/state.ts (pure logic).
//  - Coach can only edit/submit own plans (own = createdById).
//  - Templates (isTemplate) are reusable plans not tied to a real session date.

import { prisma } from "@/infrastructure/db/prisma";
import {
  PlanTransitionError,
  canApprove,
  canEdit,
  nextStatus,
  type PlanStatus,
} from "@/domain/session-plans/state";
import {
  sessionPlanInputSchema,
  type SessionPlanInput,
} from "./schemas";

export class PlanAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanAuthorizationError";
  }
}

export async function listPlansForCoach(coachId: string) {
  return prisma.sessionPlan.findMany({
    where: { createdById: coachId },
    orderBy: [{ sessionDate: "desc" }, { updatedAt: "desc" }],
    include: {
      group: { select: { id: true, name: true, location: { select: { nameEn: true } } } },
    },
  });
}

export async function listPendingApproval() {
  return prisma.sessionPlan.findMany({
    where: { status: "PENDING", isTemplate: false },
    orderBy: { reviewedAt: "asc" },
    include: {
      group: { select: { id: true, name: true, location: { select: { nameEn: true } } } },
      createdBy: { select: { id: true, fullNameEn: true, fullNameAr: true } },
    },
  });
}

export async function getPlan(id: string) {
  return prisma.sessionPlan.findUnique({
    where: { id },
    include: {
      group: { include: { location: true, discipline: true } },
      createdBy: { select: { id: true, fullNameEn: true, fullNameAr: true } },
      reviewedBy: { select: { id: true, fullNameEn: true, fullNameAr: true } },
    },
  });
}

async function assertOwner(planId: string, coachId: string) {
  const plan = await prisma.sessionPlan.findUnique({
    where: { id: planId },
    select: { createdById: true, status: true },
  });
  if (!plan) throw new PlanAuthorizationError("Plan not found");
  if (plan.createdById !== coachId) {
    throw new PlanAuthorizationError("Coaches can only modify their own plans");
  }
  return plan;
}

export async function createDraftPlan(input: SessionPlanInput, coachId: string) {
  const data = sessionPlanInputSchema.parse(input);
  const created = await prisma.sessionPlan.create({
    data: {
      groupId: data.groupId,
      sessionDate: data.sessionDate,
      status: "DRAFT",
      unitsSequence: data.units,
      notes: data.notes,
      createdById: coachId,
      isTemplate: data.isTemplate,
      templateName: data.isTemplate ? (data.templateName ?? "Untitled template") : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: coachId,
      action: "session-plan.create-draft",
      entityType: "SessionPlan",
      entityId: created.id,
    },
  });
  return created;
}

export async function updateDraftPlan(id: string, input: SessionPlanInput, coachId: string) {
  const before = await assertOwner(id, coachId);
  if (!canEdit(before.status as PlanStatus)) {
    throw new PlanTransitionError(`Plans in ${before.status} state cannot be edited`);
  }
  const data = sessionPlanInputSchema.parse(input);
  const updated = await prisma.sessionPlan.update({
    where: { id },
    data: {
      groupId: data.groupId,
      sessionDate: data.sessionDate,
      unitsSequence: data.units,
      notes: data.notes,
      isTemplate: data.isTemplate,
      templateName: data.isTemplate ? (data.templateName ?? "Untitled template") : null,
      // If currently REJECTED, edits keep it REJECTED until the coach explicitly resubmits or pulls back.
    },
  });
  await prisma.auditLog.create({
    data: {
      actorId: coachId,
      action: "session-plan.update-draft",
      entityType: "SessionPlan",
      entityId: id,
    },
  });
  return updated;
}

export async function submitPlan(id: string, coachId: string) {
  const before = await assertOwner(id, coachId);
  const newStatus = nextStatus(before.status as PlanStatus, "submit");
  return transitionTo(id, newStatus, { actorId: coachId, action: "submit" });
}

export async function resubmitPlan(id: string, coachId: string) {
  const before = await assertOwner(id, coachId);
  const newStatus = nextStatus(before.status as PlanStatus, "resubmit");
  return transitionTo(id, newStatus, { actorId: coachId, action: "resubmit" });
}

export async function pullBackPlan(id: string, coachId: string) {
  const before = await assertOwner(id, coachId);
  const newStatus = nextStatus(before.status as PlanStatus, "pull-back");
  return transitionTo(id, newStatus, { actorId: coachId, action: "pull-back" });
}

export async function approvePlan(id: string, headCoachId: string) {
  const plan = await prisma.sessionPlan.findUnique({ where: { id }, select: { status: true } });
  if (!plan) throw new PlanAuthorizationError("Plan not found");
  if (!canApprove(plan.status as PlanStatus)) {
    throw new PlanTransitionError(`Plan must be PENDING to approve (got ${plan.status})`);
  }
  const newStatus = nextStatus(plan.status as PlanStatus, "approve");
  return transitionTo(id, newStatus, {
    actorId: headCoachId,
    action: "approve",
    extra: { reviewedById: headCoachId, reviewedAt: new Date(), rejectionComment: null },
  });
}

export async function rejectPlan(id: string, headCoachId: string, comment: string) {
  const plan = await prisma.sessionPlan.findUnique({ where: { id }, select: { status: true } });
  if (!plan) throw new PlanAuthorizationError("Plan not found");
  const newStatus = nextStatus(plan.status as PlanStatus, "reject", { rejectionComment: comment });
  return transitionTo(id, newStatus, {
    actorId: headCoachId,
    action: "reject",
    extra: { reviewedById: headCoachId, reviewedAt: new Date(), rejectionComment: comment },
  });
}

export async function reviewPlan(
  id: string,
  headCoachId: string,
  action: "approve" | "reject",
  units: { trainingUnitId: string; durationOverrideSec?: number | null; roundsOverride?: number | null; notes?: string }[],
  notes: string | undefined,
  comment: string,
) {
  const plan = await prisma.sessionPlan.findUnique({ where: { id }, select: { status: true } });
  if (!plan) throw new PlanAuthorizationError("Plan not found");

  const targetStatus = nextStatus(
    plan.status as PlanStatus,
    action,
    action === "reject" ? { rejectionComment: comment } : {}
  );

  const updated = await prisma.sessionPlan.update({
    where: { id },
    data: {
      status: targetStatus,
      unitsSequence: units,
      notes: notes || null,
      reviewedById: headCoachId,
      reviewedAt: new Date(),
      rejectionComment: comment || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: headCoachId,
      action: `session-plan.review-${action}`,
      entityType: "SessionPlan",
      entityId: id,
      changes: { newStatus: targetStatus, comment },
    },
  });
  return updated;
}

interface TransitionOpts {
  actorId: string;
  action: string;
  extra?: Partial<{
    reviewedById: string;
    reviewedAt: Date;
    rejectionComment: string | null;
  }>;
}

async function transitionTo(planId: string, newStatus: PlanStatus, opts: TransitionOpts) {
  const updated = await prisma.sessionPlan.update({
    where: { id: planId },
    data: { status: newStatus, ...opts.extra },
  });
  await prisma.auditLog.create({
    data: {
      actorId: opts.actorId,
      action: `session-plan.${opts.action}`,
      entityType: "SessionPlan",
      entityId: planId,
      changes: { newStatus },
    },
  });
  return updated;
}
