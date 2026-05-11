import { listPublicLocations } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

// GET /api/v1/public/locations
// Returns sanitized location list — used by the public website AND v2 mobile app.
export async function GET() {
  const data = await listPublicLocations();
  return jsonResponse({ locations: data });
}
