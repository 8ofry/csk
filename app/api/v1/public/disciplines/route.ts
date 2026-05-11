import { listPublicDisciplines } from "@/application/public/service";
import { jsonResponse } from "@/lib/api";

export async function GET() {
  const data = await listPublicDisciplines();
  return jsonResponse({ disciplines: data });
}
