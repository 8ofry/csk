"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  pullBackDailyReportAction,
  resubmitDailyReportAction,
  submitDailyReportAction,
  updateDailyReportAction,
} from "@/app/actions/daily-reports";

export interface DailyReportFormProps {
  reportId: string;
  status: string;
  defaultValues?: { summary?: string; incidents?: string };
  rejectionReason?: string | null;
}

/** Parse a raw error string — may be a Zod JSON array or plain text. */
function parseErrorMessage(raw: string): string {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Extract human-readable messages from Zod issue array
      return parsed
        .map((issue: { path?: string[]; message?: string }) => {
          const field = issue.path?.join(".") ?? "";
          const msg = issue.message ?? "Invalid value";
          if (field === "summary") return `Session summary: ${msg}`;
          if (field === "incidents") return `Incidents: ${msg}`;
          return msg;
        })
        .join(". ");
    }
  } catch {
    // not JSON — just return as-is
  }
  return raw;
}

export function DailyReportForm({
  reportId,
  status,
  defaultValues,
  rejectionReason,
}: DailyReportFormProps) {
  const t = useTranslations("coachDailyReport");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();
  const editable = status === "DRAFT" || status === "REJECTED";

  function save(formData: FormData, andThen?: "submit" | "resubmit") {
    startTransition(async () => {
      setError(null);
      setSavedAt(null);

      const updateResult = await updateDailyReportAction(reportId, formData);
      if (updateResult.error) {
        setError(parseErrorMessage(updateResult.error));
        return;
      }

      if (andThen === "submit") {
        const r = await submitDailyReportAction(reportId);
        if (r.error) setError(parseErrorMessage(r.error));
        else router.push("/coach/today");
      } else if (andThen === "resubmit") {
        const r = await resubmitDailyReportAction(reportId);
        if (r.error) setError(parseErrorMessage(r.error));
        else router.push("/coach/today");
      } else {
        // Draft saved — show confirmation
        setSavedAt(new Date());
      }
    });
  }

  function pullBack() {
    startTransition(async () => {
      setError(null);
      const r = await pullBackDailyReportAction(reportId);
      if (r.error) setError(parseErrorMessage(r.error));
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        save(new FormData(e.currentTarget));
      }}
    >
      {status === "REJECTED" && rejectionReason && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm">
          <strong>{t("rejectedPrefix")}</strong> {rejectionReason}
        </div>
      )}

      <div>
        <Label htmlFor="summary">
          {t("summary")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="summary"
          name="summary"
          required
          rows={5}
          defaultValue={defaultValues?.summary ?? ""}
          disabled={!editable}
          className="mt-1"
          placeholder={t("summaryPlaceholder")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Required — describe what the group covered today, highlights and lowlights.
        </p>
      </div>

      <div>
        <Label htmlFor="incidents">{t("incidents")}</Label>
        <Textarea
          id="incidents"
          name="incidents"
          rows={3}
          defaultValue={defaultValues?.incidents ?? ""}
          disabled={!editable}
          className="mt-1"
          placeholder={t("incidentsPlaceholder")}
        />
      </div>

      {/* Feedback row */}
      <div className="flex flex-wrap items-center gap-3 min-h-[28px]">
        {savedAt && !error && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Draft saved at {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
        {error && (
          <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive w-full">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {editable && (
          <>
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Saving…" : t("saveDraft")}
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={(e) =>
                save(
                  new FormData((e.currentTarget as HTMLButtonElement).form ?? undefined),
                  status === "REJECTED" ? "resubmit" : "submit",
                )
              }
            >
              {pending ? "Submitting…" : status === "REJECTED" ? t("resubmit") : t("submitForApproval")}
            </Button>
          </>
        )}
        {status === "REJECTED" && (
          <Button type="button" variant="ghost" disabled={pending} onClick={pullBack}>
            {t("pullBack")}
          </Button>
        )}
      </div>
    </form>
  );
}
