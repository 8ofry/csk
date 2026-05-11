import { auth } from "@/auth";
import { isAtLeast } from "@/lib/rbac";
import type { UserRole } from "@prisma/client";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireRole(minimum: UserRole) {
  const session = await auth();
  if (!session?.user) {
    throw new AuthorizationError("Not signed in");
  }
  if (!isAtLeast(session.user.role, minimum)) {
    throw new AuthorizationError(`Requires ${minimum} role`);
  }
  return session.user;
}

export async function requireExactRole(role: UserRole) {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError("Not signed in");
  if (session.user.role !== role) throw new AuthorizationError(`Requires ${role} role`);
  return session.user;
}
