import "next-auth";
import "next-auth/jwt";
import type { UserRole, Locale } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      locale: Locale;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: UserRole;
    locale: Locale;
  }
}
