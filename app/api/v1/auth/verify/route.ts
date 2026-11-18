import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";
import { verifyVerificationToken } from "@/lib/verification-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const email = verifyVerificationToken(token);
  if (!email) {
    return new NextResponse("Invalid or expired token", { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const locale = user.preferredLocale === "EN" ? "en" : "ar";

  if (user.emailVerifiedAt) {
    return NextResponse.redirect(new URL(`/${locale}/login?verified=already`, request.url));
  }

  // FR-AUTH-03: email verification confirms email ownership only;
  // account remains PENDING until Head Coach or Admin approves it.
  await prisma.user.update({
    where: { email },
    data: {
      emailVerifiedAt: new Date(),
    },
  });

  return NextResponse.redirect(new URL(`/${locale}/login?verified=success`, request.url));
}
