// GET /api/v1/me/certificates

import { listCertificatesForUser } from "@/application/certificates/service";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;
  const certificates = await listCertificatesForUser(auth.user.id);
  return jsonResponse({ certificates });
}
