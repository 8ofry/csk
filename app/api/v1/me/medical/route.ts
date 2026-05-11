// GET /api/v1/me/medical — own medical record + documents.

import { getTraineeMedical, isTraineeCleared } from "@/application/medical/service";
import { requireApiUser } from "@/lib/api-auth";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const auth = await requireApiUser(req);
  if ("response" in auth) return auth.response;

  const [{ record, documents }, cleared] = await Promise.all([
    getTraineeMedical(auth.user.id),
    isTraineeCleared(auth.user.id),
  ]);

  return jsonResponse({ record, documents, cleared });
}
