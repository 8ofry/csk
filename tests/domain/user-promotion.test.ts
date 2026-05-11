import { describe, expect, it } from "vitest";
import {
  UserTransitionError,
  validatePromotion,
  validateStatusTransition,
} from "@/domain/users/promotion";

describe("user promotion — FR-AUTH-10", () => {
  it("INTERN → COACH is allowed", () => {
    expect(() => validatePromotion("INTERN", "COACH")).not.toThrow();
  });

  it("rejects all other promotions", () => {
    expect(() => validatePromotion("COACH", "HEAD_COACH")).toThrow(UserTransitionError);
    expect(() => validatePromotion("TRAINEE", "COACH")).toThrow(UserTransitionError);
    expect(() => validatePromotion("INTERN", "ADMIN")).toThrow(UserTransitionError);
    expect(() => validatePromotion("HEAD_COACH", "ADMIN")).toThrow(UserTransitionError);
  });
});

describe("account status transitions — FR-AUTH-11", () => {
  it("PENDING → ACTIVE (approve)", () => {
    expect(() => validateStatusTransition("PENDING", "ACTIVE")).not.toThrow();
  });
  it("PENDING → SUSPENDED (reject)", () => {
    expect(() => validateStatusTransition("PENDING", "SUSPENDED")).not.toThrow();
  });
  it("ACTIVE → SUSPENDED (suspend)", () => {
    expect(() => validateStatusTransition("ACTIVE", "SUSPENDED")).not.toThrow();
  });
  it("SUSPENDED → ACTIVE (reactivate)", () => {
    expect(() => validateStatusTransition("SUSPENDED", "ACTIVE")).not.toThrow();
  });
  it("same-state transitions are no-ops", () => {
    expect(() => validateStatusTransition("ACTIVE", "ACTIVE")).not.toThrow();
    expect(() => validateStatusTransition("SUSPENDED", "SUSPENDED")).not.toThrow();
  });
  it("ACTIVE → PENDING is rejected", () => {
    expect(() => validateStatusTransition("ACTIVE", "PENDING")).toThrow(UserTransitionError);
  });
  it("SUSPENDED → PENDING is rejected", () => {
    expect(() => validateStatusTransition("SUSPENDED", "PENDING")).toThrow(UserTransitionError);
  });
});
