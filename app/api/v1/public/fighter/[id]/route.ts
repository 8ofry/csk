import { getPublicFighterProfile } from "@/application/public/fighter";
import { jsonError, jsonResponse } from "@/lib/api";

// GET /api/v1/public/fighter/:id — sanitized public profile.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const profile = await getPublicFighterProfile(id);
  if (!profile) return jsonError("Fighter not found", 404);
  return jsonResponse({ fighter: profile });
}
