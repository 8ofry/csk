import { listPublicChampions } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 24)));
  const data = await listPublicChampions(limit);
  return jsonResponse({ champions: data });
}
