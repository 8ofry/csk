// Daily Report state machine — pure logic.
// SRS §6.6 (FR-DR-01..05).
//
// States:
//   DRAFT     — coach is composing
//   PENDING   — submitted, awaiting Head Coach review
//   APPROVED  — Head Coach approved → delivered to trainee/parent
//   REJECTED  — Head Coach rejected with comment → back to coach for revision
//
// Allowed transitions:
//   DRAFT     → PENDING   (coach submits)
//   PENDING   → APPROVED  (head coach approves)
//   PENDING   → REJECTED  (head coach rejects with comment ≥3 chars)
//   REJECTED  → PENDING   (coach resubmits)
//   REJECTED  → DRAFT     (coach pulls back)

export type DailyReportStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type DailyReportAction = "submit" | "approve" | "reject" | "resubmit" | "pull-back";

export class DailyReportTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyReportTransitionError";
  }
}

interface TransitionContext {
  rejectionComment?: string;
}

export function nextDailyReportStatus(
  current: DailyReportStatus,
  action: DailyReportAction,
  ctx: TransitionContext = {},
): DailyReportStatus {
  switch (current) {
    case "DRAFT":
      if (action === "submit") return "PENDING";
      break;
    case "PENDING":
      if (action === "approve") return "APPROVED";
      if (action === "reject") {
        if (!ctx.rejectionComment || ctx.rejectionComment.trim().length < 3) {
          throw new DailyReportTransitionError("Rejection comment is required (min 3 chars)");
        }
        return "REJECTED";
      }
      break;
    case "REJECTED":
      if (action === "resubmit") return "PENDING";
      if (action === "pull-back") return "DRAFT";
      break;
    case "APPROVED":
      // Approved reports are immutable; corrections are change-requested separately.
      break;
  }
  throw new DailyReportTransitionError(`Invalid transition: ${current} -> ${action}`);
}

export function canEditDailyReport(status: DailyReportStatus): boolean {
  return status === "DRAFT" || status === "REJECTED";
}

export function canApproveDailyReport(status: DailyReportStatus): boolean {
  return status === "PENDING";
}
