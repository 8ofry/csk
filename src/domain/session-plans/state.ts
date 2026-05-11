// Session Plan state machine — pure logic, no I/O.
// SRS §6.4 (FR-SES-01..06).
//
// States:
//   DRAFT     — coach is editing
//   PENDING   — submitted, awaiting Head Coach review
//   APPROVED  — Head Coach approved; visible to coach + intern + (summary) trainees
//   REJECTED  — Head Coach rejected with comment; goes back to coach for revision
//
// Allowed transitions:
//   DRAFT     → PENDING   (coach submits)
//   PENDING   → APPROVED  (head coach approves)
//   PENDING   → REJECTED  (head coach rejects with comment)
//   REJECTED  → PENDING   (coach resubmits after edits)
//   REJECTED  → DRAFT     (coach pulls back to keep editing)
//   APPROVED  → APPROVED  (idempotent — no-op)

export type PlanStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type PlanAction = "submit" | "approve" | "reject" | "resubmit" | "pull-back";

export class PlanTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanTransitionError";
  }
}

interface TransitionContext {
  /** Required when action is "reject" */
  rejectionComment?: string;
}

export function nextStatus(
  current: PlanStatus,
  action: PlanAction,
  context: TransitionContext = {},
): PlanStatus {
  switch (current) {
    case "DRAFT":
      if (action === "submit") return "PENDING";
      break;
    case "PENDING":
      if (action === "approve") return "APPROVED";
      if (action === "reject") {
        if (!context.rejectionComment || context.rejectionComment.trim().length < 3) {
          throw new PlanTransitionError("Rejection comment is required (min 3 chars)");
        }
        return "REJECTED";
      }
      break;
    case "REJECTED":
      if (action === "resubmit") return "PENDING";
      if (action === "pull-back") return "DRAFT";
      break;
    case "APPROVED":
      // Approved plans are immutable from the workflow perspective;
      // execution data is recorded against the Session, not the plan.
      break;
  }
  throw new PlanTransitionError(`Invalid transition: ${current} -> ${action}`);
}

export function canEdit(status: PlanStatus): boolean {
  // Coach edits in DRAFT and REJECTED only
  return status === "DRAFT" || status === "REJECTED";
}

export function canApprove(status: PlanStatus): boolean {
  return status === "PENDING";
}
