import { listPublicCoaches } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const data = await listPublicCoaches();
  return jsonResponse({ coaches: data });
}
