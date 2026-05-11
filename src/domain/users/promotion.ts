// Promotion + role-transition validation — pure logic.
// SRS FR-AUTH-10: Head Coach can promote an Intern to a Coach.
// FR-AUTH-11: Suspension / reactivation by Admin or Head Coach.

export type UserRole = "ADMIN" | "HEAD_COACH" | "COACH" | "INTERN" | "TRAINEE";
export type AccountStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export class UserTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserTransitionError";
  }
}

/** Only Intern → Coach is allowed in v1. Other role transitions need explicit policy. */
export function validatePromotion(
  currentRole: UserRole,
  targetRole: UserRole,
): void {
  if (currentRole === "INTERN" && targetRole === "COACH") return;
  throw new UserTransitionError(
    `Promotion from ${currentRole} to ${targetRole} is not supported`,
  );
}

/**
 * Allowed account-status transitions.
 *  PENDING → ACTIVE       (approval)
 *  PENDING → SUSPENDED    (rejection)
 *  ACTIVE → SUSPENDED     (suspension)
 *  SUSPENDED → ACTIVE     (reactivation)
 *  ACTIVE → ACTIVE        (no-op, allowed)
 */
export function validateStatusTransition(
  current: AccountStatus,
  next: AccountStatus,
): void {
  if (current === next) return;
  const allowed: Record<AccountStatus, AccountStatus[]> = {
    PENDING: ["ACTIVE", "SUSPENDED"],
    ACTIVE: ["SUSPENDED"],
    SUSPENDED: ["ACTIVE"],
  };
  if (!allowed[current].includes(next)) {
    throw new UserTransitionError(`Cannot move account from ${current} to ${next}`);
  }
}
