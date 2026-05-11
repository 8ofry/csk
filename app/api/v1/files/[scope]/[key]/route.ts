// Stream a previously-stored file from the storage adapter.
// Local-disk in dev, S3/R2 in production — caller URL stays the same.
//
// Authorization: monthly reports + certificates are personal data — only the
// recipient (or their parent), the issuer, or staff (Admin / Head Coach) can
// fetch. Other scopes (training-unit, merchandise-photo) are public.

import { auth } from "@/auth";
import { storage, type StorageScope } from "@/infrastructure/storage/storage";
import { prisma } from "@/infrastructure/db/prisma";
import { jsonError } from "@/lib/api";

const PRIVATE_SCOPES: StorageScope[] = ["monthly-report", "certificate", "medical-document"];
const KNOWN_SCOPES: StorageScope[] = [
  "training-unit",
  "medical-document",
  "profile-photo",
  "merchandise-photo",
  "monthly-report",
  "certificate",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ scope: string; key: string }> },
) {
  const { scope, key } = await params;
  if (!KNOWN_SCOPES.includes(scope as StorageScope)) {
    return jsonError("Unknown scope", 404);
  }

  if (PRIVATE_SCOPES.includes(scope as StorageScope)) {
    const allowed = await canRead(scope as StorageScope, key);
    if (!allowed) return jsonError("Forbidden", 403);
  }

  const file = await storage.read({ scope: scope as StorageScope, key });
  if (!file) return jsonError("Not found", 404);

  return new Response(new Uint8Array(file.data), {
    headers: {
      "content-type": file.contentType,
      "content-length": String(file.data.byteLength),
      "cache-control": "private, max-age=300",
    },
  });
}

async function canRead(scope: StorageScope, key: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  if (session.user.role === "ADMIN" || session.user.role === "HEAD_COACH") return true;

  // Resource-id is the basename without extension — both monthly-report and
  // certificate use `${id}.pdf`.
  const id = key.replace(/\.[^.]+$/, "");

  if (scope === "monthly-report") {
    const report = await prisma.monthlyReport.findUnique({
      where: { id },
      select: { traineeId: true, trainee: { select: { parentUserId: true } } },
    });
    if (!report) return false;
    return (
      session.user.id === report.traineeId ||
      session.user.id === report.trainee.parentUserId
    );
  }

  if (scope === "certificate") {
    const cert = await prisma.certificate.findUnique({
      where: { id },
      select: { recipientId: true, issuedById: true },
    });
    if (!cert) return false;
    return session.user.id === cert.recipientId || session.user.id === cert.issuedById;
  }

  if (scope === "medical-document") {
    const doc = await prisma.medicalDocument.findUnique({
      where: { id },
      select: { traineeId: true, trainee: { select: { parentUserId: true } } },
    });
    if (!doc) return false;
    return (
      session.user.id === doc.traineeId ||
      session.user.id === doc.trainee.parentUserId
    );
  }

  return false;
}
