import { describe, expect, it } from "vitest";
import {
  DailyReportTransitionError,
  canApproveDailyReport,
  canEditDailyReport,
  nextDailyReportStatus,
} from "@/domain/daily-reports/state";

describe("daily-report state machine — SRS §6.6", () => {
  it("DRAFT → submit → PENDING", () => {
    expect(nextDailyReportStatus("DRAFT", "submit")).toBe("PENDING");
  });
  it("PENDING → approve → APPROVED", () => {
    expect(nextDailyReportStatus("PENDING", "approve")).toBe("APPROVED");
  });
  it("PENDING → reject (with comment) → REJECTED", () => {
    expect(
      nextDailyReportStatus("PENDING", "reject", { rejectionComment: "Add summary detail" }),
    ).toBe("REJECTED");
  });
  it("REJECTED → resubmit → PENDING", () => {
    expect(nextDailyReportStatus("REJECTED", "resubmit")).toBe("PENDING");
  });
  it("REJECTED → pull-back → DRAFT", () => {
    expect(nextDailyReportStatus("REJECTED", "pull-back")).toBe("DRAFT");
  });

  it("rejects without a meaningful comment", () => {
    expect(() => nextDailyReportStatus("PENDING", "reject")).toThrow(DailyReportTransitionError);
    expect(() => nextDailyReportStatus("PENDING", "reject", { rejectionComment: "  " })).toThrow(
      DailyReportTransitionError,
    );
  });

  it("APPROVED is terminal", () => {
    expect(() => nextDailyReportStatus("APPROVED", "submit")).toThrow(DailyReportTransitionError);
    expect(() => nextDailyReportStatus("APPROVED", "approve")).toThrow(DailyReportTransitionError);
  });

  it("DRAFT cannot be approved or rejected directly", () => {
    expect(() => nextDailyReportStatus("DRAFT", "approve")).toThrow(DailyReportTransitionError);
    expect(() =>
      nextDailyReportStatus("DRAFT", "reject", { rejectionComment: "fix" }),
    ).toThrow(DailyReportTransitionError);
  });

  it("predicates", () => {
    expect(canEditDailyReport("DRAFT")).toBe(true);
    expect(canEditDailyReport("REJECTED")).toBe(true);
    expect(canEditDailyReport("PENDING")).toBe(false);
    expect(canEditDailyReport("APPROVED")).toBe(false);

    expect(canApproveDailyReport("PENDING")).toBe(true);
    expect(canApproveDailyReport("DRAFT")).toBe(false);
  });
});
