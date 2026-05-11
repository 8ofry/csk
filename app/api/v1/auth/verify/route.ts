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

  if (user.emailVerifiedAt) {
    return NextResponse.redirect(new URL("/login?verified=already", request.url));
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
    },
  });

  return NextResponse.redirect(new URL("/login?verified=success", request.url));
}
