"use server";

import { revalidateLocalized } from "@/lib/revalidate";
import { headers } from "next/headers";
import {
  approveDailyReport,
  ensureDailyReport,
  pullBackDailyReport,
  rejectDailyReport,
  resubmitDailyReport,
  submitDailyReport,
  updateDailyReport,
  dailyReportInputSchema,
} from "@/application/daily-reports/service";
import { requireRole } from "@/lib/auth-guard";

async function appUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function ensureDailyReportAction(
  sessionId: string,
): Promise<{ ok?: true; reportId?: string; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const report = await ensureDailyReport(sessionId, user.id);
    revalidateLocalized(`/coach/sessions/${sessionId}`);
    return { ok: true, reportId: report.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateDailyReportAction(
  reportId: string,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    const data = dailyReportInputSchema.parse({
      summary: String(formData.get("summary") ?? ""),
      incidents: String(formData.get("incidents") ?? "") || undefined,
    });
    await updateDailyReport(reportId, data, user.id);
    revalidateLocalized(`/coach/daily-reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function submitDailyReportAction(
  reportId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await submitDailyReport(reportId, user.id);
    revalidateLocalized(`/coach/daily-reports/${reportId}`);
    revalidateLocalized("/head-coach/approvals");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function resubmitDailyReportAction(
  reportId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await resubmitDailyReport(reportId, user.id);
    revalidateLocalized(`/coach/daily-reports/${reportId}`);
    revalidateLocalized("/head-coach/approvals");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function pullBackDailyReportAction(
  reportId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("COACH");
    await pullBackDailyReport(reportId, user.id);
    revalidateLocalized(`/coach/daily-reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function approveDailyReportAction(
  reportId: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await approveDailyReport(reportId, user.id, await appUrl());
    revalidateLocalized("/head-coach/approvals");
    revalidateLocalized(`/head-coach/daily-reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function rejectDailyReportAction(
  reportId: string,
  comment: string,
): Promise<{ ok?: true; error?: string }> {
  try {
    const user = await requireRole("HEAD_COACH");
    await rejectDailyReport(reportId, user.id, comment);
    revalidateLocalized("/head-coach/approvals");
    revalidateLocalized(`/head-coach/daily-reports/${reportId}`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
