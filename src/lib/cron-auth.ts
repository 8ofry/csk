import { auth } from "@/auth";
import { jsonError } from "@/lib/api";

export async function requireAdminOrCron(req: Request): Promise<Response | null> {
  const session = await auth();
  if (session?.user?.role === "ADMIN") return null;
  const cronSecret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (cronSecret && header === `Bearer ${cronSecret}`) return null;
  return jsonError("Forbidden", 403);
}
