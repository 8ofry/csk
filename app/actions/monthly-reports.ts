"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  approveAndDeliver,
  generateForTrainee,
} from "@/application/monthly-reports/service";
import { requireRole } from "@/lib/auth-guard";

async function appUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function generateMonthlyReportAction(input: {
  traineeId: string;
  year: number;
  month: number;
}): Promise<{ ok?: true; reportId?: string; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    const r = await generateForTrainee(input, user.id);
    revalidatePath("/head-coach/monthly-reports");
    return { ok: true, reportId: r.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function approveMonthlyReportAction(
  reportId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await approveAndDeliver(reportId, user.id, await appUrl());
    revalidatePath("/head-coach/monthly-reports");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
