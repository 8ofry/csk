import { publicScheduleByLocation } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

// GET /api/v1/public/schedule
// Returns groups grouped per active location with weekly schedule json.
export async function GET() {
  const data = await publicScheduleByLocation();
  return jsonResponse({ locations: data });
}
