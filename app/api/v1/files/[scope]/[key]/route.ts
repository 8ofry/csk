// Stream a previously-stored file from the storage adapter.
// Local-disk in dev, S3/R2 in production — caller URL stays the same.
//
// Authorization: monthly reports + certificates are personal data — only the
// recipient (or their parent), the issuer, or staff (Admin / Head Coach) can
// fetch. Other scopes (training-unit, merchandise-photo) are public.

import { auth } from "@/auth";
import { authenticate } from "@/lib/api-auth";
import { storage, type StorageScope } from "@/infrastructure/storage/storage";
import { prisma } from "@/infrastructure/db/prisma";
import { jsonError } from "@/lib/api";

const PRIVATE_SCOPES: StorageScope[] = [
  "monthly-report",
  "certificate",
  "medical-document",
  "payment-receipt",
];
const KNOWN_SCOPES: StorageScope[] = [
  "training-unit",
  "medical-document",
  "payment-receipt",
  "profile-photo",
  "merchandise-photo",
  "monthly-report",
  "certificate",
];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ scope: string; key: string }> },
) {
  const { scope, key } = await params;
  if (!KNOWN_SCOPES.includes(scope as StorageScope)) {
    return jsonError("Unknown scope", 404);
  }

  if (PRIVATE_SCOPES.includes(scope as StorageScope)) {
    const allowed = await canRead(req, scope as StorageScope, key);
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

async function resolveAuthUser(req: Request) {
  const apiUser = await authenticate(req);
  if (apiUser) return { id: apiUser.id, role: apiUser.role };
  const session = await auth();
  if (session?.user) return { id: session.user.id, role: session.user.role };
  return null;
}

async function canRead(req: Request, scope: StorageScope, key: string): Promise<boolean> {
  const user = await resolveAuthUser(req);
  if (!user) return false;
  if (user.role === "ADMIN" || user.role === "HEAD_COACH") return true;

  // Resource-id is the basename without extension — both monthly-report and
  // certificate use `${id}.pdf`.
  const id = key.replace(/\.[^.]+$/, "");

  if (scope === "monthly-report") {
    const report = await prisma.monthlyReport.findUnique({
      where: { id },
      select: { traineeId: true, trainee: { select: { parentUserId: true } } },
    });
    if (!report) return false;
    return user.id === report.traineeId || user.id === report.trainee.parentUserId;
  }

  if (scope === "certificate") {
    const cert = await prisma.certificate.findUnique({
      where: { id },
      select: { recipientId: true, issuedById: true },
    });
    if (!cert) return false;
    return user.id === cert.recipientId || user.id === cert.issuedById;
  }

  if (scope === "medical-document") {
    const doc = await prisma.medicalDocument.findUnique({
      where: { id },
      select: { traineeId: true, trainee: { select: { parentUserId: true } } },
    });
    if (!doc) return false;
    if (user.id === doc.traineeId || user.id === doc.trainee.parentUserId) return true;
    if (user.role === "COACH") {
      // FR-MED-05: Primary coach can view medical documents for trainees in their active groups.
      const assigned = await prisma.enrollment.findFirst({
        where: {
          traineeId: doc.traineeId,
          status: "ACTIVE",
          group: { coaches: { some: { coachId: user.id } } },
        },
        select: { id: true },
      });
      return !!assigned;
    }
    return false;
  }

  if (scope === "payment-receipt") {
    const reg = await prisma.championshipRegistration.findFirst({
      where: { paymentReceiptUrl: `/api/v1/files/payment-receipt/${key}` },
      select: {
        traineeId: true,
        trainee: { select: { parentUserId: true, academyId: true } },
      },
    });
    if (!reg) return false;
    if (user.id === reg.traineeId || user.id === reg.trainee.parentUserId) return true;
    if (user.role === "COACH" && reg.trainee.academyId) {
      const coach = await prisma.user.findUnique({
        where: { id: user.id },
        select: { academyId: true },
      });
      return !!coach?.academyId && coach.academyId === reg.trainee.academyId;
    }
    return false;
  }

  return false;
}
