import { publicPricing } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const data = await publicPricing();
  return jsonResponse(data);
}
