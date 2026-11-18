import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { prisma } from "@/infrastructure/db/prisma";

const credentialsSchema = z.object({
  identifier: z.string().min(1), // email or phone (FR-AUTH-05)
  password: z.string().min(8),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        identifier: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { identifier, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ email: identifier.toLowerCase() }, { phone: identifier }],
          },
        });
        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (!user.emailVerifiedAt) return null;

        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.preferredLocale === "AR" ? user.fullNameAr : user.fullNameEn,
          role: user.role,
          locale: user.preferredLocale,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.uid = user.id;
        token.role = user.role;
        token.locale = user.locale;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (typeof token.uid === "string") session.user.id = token.uid;
        session.user.role = token.role;
        session.user.locale = token.locale;
      }
      return session;
    },
  },
});
