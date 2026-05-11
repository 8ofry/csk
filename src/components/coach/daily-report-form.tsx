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

export function DailyReportForm({
  reportId,
  status,
  defaultValues,
  rejectionReason,
}: DailyReportFormProps) {
  const t = useTranslations("coachDailyReport");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const editable = status === "DRAFT" || status === "REJECTED";

  function save(formData: FormData, andThen?: "submit" | "resubmit") {
    startTransition(async () => {
      setError(null);
      const updateResult = await updateDailyReportAction(reportId, formData);
      if (updateResult.error) {
        setError(updateResult.error);
        return;
      }
      if (andThen === "submit") {
        const r = await submitDailyReportAction(reportId);
        if (r.error) setError(r.error);
        else router.push("/coach/today");
      } else if (andThen === "resubmit") {
        const r = await resubmitDailyReportAction(reportId);
        if (r.error) setError(r.error);
        else router.push("/coach/today");
      }
    });
  }

  function pullBack() {
    startTransition(async () => {
      setError(null);
      const r = await pullBackDailyReportAction(reportId);
      if (r.error) setError(r.error);
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
        <Label htmlFor="summary">{t("summary")}</Label>
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {editable && (
          <>
            <Button type="submit" variant="outline" disabled={pending}>
              {t("saveDraft")}
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
              {status === "REJECTED" ? t("resubmit") : t("submitForApproval")}
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
