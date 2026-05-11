import { describe, expect, it } from "vitest";
import {
  PlanTransitionError,
  canApprove,
  canEdit,
  nextStatus,
} from "@/domain/session-plans/state";

describe("session-plan state machine — SRS §6.4", () => {
  describe("happy paths", () => {
    it("DRAFT → submit → PENDING", () => {
      expect(nextStatus("DRAFT", "submit")).toBe("PENDING");
    });
    it("PENDING → approve → APPROVED", () => {
      expect(nextStatus("PENDING", "approve")).toBe("APPROVED");
    });
    it("PENDING → reject (with comment) → REJECTED", () => {
      expect(nextStatus("PENDING", "reject", { rejectionComment: "Add cool-down" })).toBe(
        "REJECTED",
      );
    });
    it("REJECTED → resubmit → PENDING", () => {
      expect(nextStatus("REJECTED", "resubmit")).toBe("PENDING");
    });
    it("REJECTED → pull-back → DRAFT", () => {
      expect(nextStatus("REJECTED", "pull-back")).toBe("DRAFT");
    });
  });

  describe("invalid transitions are blocked", () => {
    it("DRAFT cannot be approved", () => {
      expect(() => nextStatus("DRAFT", "approve")).toThrow(PlanTransitionError);
    });
    it("DRAFT cannot be rejected", () => {
      expect(() =>
        nextStatus("DRAFT", "reject", { rejectionComment: "no" }),
      ).toThrow(PlanTransitionError);
    });
    it("PENDING cannot be submitted again", () => {
      expect(() => nextStatus("PENDING", "submit")).toThrow(PlanTransitionError);
    });
    it("APPROVED cannot transition further", () => {
      expect(() => nextStatus("APPROVED", "submit")).toThrow(PlanTransitionError);
      expect(() => nextStatus("APPROVED", "reject", { rejectionComment: "no" })).toThrow(
        PlanTransitionError,
      );
      expect(() => nextStatus("APPROVED", "approve")).toThrow(PlanTransitionError);
    });
    it("REJECTED cannot be approved directly (must resubmit first)", () => {
      expect(() => nextStatus("REJECTED", "approve")).toThrow(PlanTransitionError);
    });
  });

  describe("rejection requires meaningful comment", () => {
    it("rejects without comment", () => {
      expect(() => nextStatus("PENDING", "reject")).toThrow(PlanTransitionError);
    });
    it("rejects with too-short comment", () => {
      expect(() => nextStatus("PENDING", "reject", { rejectionComment: "no" })).toThrow(
        PlanTransitionError,
      );
    });
    it("accepts a 3+ character comment", () => {
      expect(nextStatus("PENDING", "reject", { rejectionComment: "fix" })).toBe("REJECTED");
    });
  });

  describe("predicates", () => {
    it("canEdit only in DRAFT or REJECTED", () => {
      expect(canEdit("DRAFT")).toBe(true);
      expect(canEdit("REJECTED")).toBe(true);
      expect(canEdit("PENDING")).toBe(false);
      expect(canEdit("APPROVED")).toBe(false);
    });
    it("canApprove only in PENDING", () => {
      expect(canApprove("PENDING")).toBe(true);
      expect(canApprove("DRAFT")).toBe(false);
      expect(canApprove("REJECTED")).toBe(false);
      expect(canApprove("APPROVED")).toBe(false);
    });
  });
});
