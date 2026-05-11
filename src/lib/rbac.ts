// SRS §8 Permissions Matrix — single source of truth for role-based authorization.
// Helpers here are intentionally simple booleans; complex conditional rules
// (e.g. "Coach can view medical records of OWN primary trainees only") are
// enforced in application/service layer, not here.

import type { UserRole } from "@prisma/client";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 5,
  HEAD_COACH: 4,
  COACH: 3,
  INTERN: 2,
  TRAINEE: 1,
};

export function isAtLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
}

// Section anchors map a route segment to the minimum role required.
// Conditional checks (own-resource etc.) are enforced inside route handlers.
export const ROUTE_MIN_ROLE: Record<string, UserRole> = {
  admin: "ADMIN",
  "head-coach": "HEAD_COACH",
  coach: "COACH",
  intern: "INTERN",
  trainee: "TRAINEE",
};

export function dashboardPathFor(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "HEAD_COACH":
      return "/head-coach";
    case "COACH":
      return "/coach";
    case "INTERN":
      return "/intern";
    case "TRAINEE":
      return "/trainee";
  }
}
