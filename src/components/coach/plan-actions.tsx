"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  pullBackPlanAction,
  resubmitPlanAction,
  submitPlanAction,
} from "@/app/actions/session-plans";

export function PlanActions({ planId, status }: { planId: string; status: string }) {
  const t = useTranslations("coachPlanActions");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      setError(null);
      const result = await submitPlanAction(planId);
      if (result.error) setError(result.error);
    });
  };
  const resubmit = () => {
    startTransition(async () => {
      setError(null);
      const result = await resubmitPlanAction(planId);
      if (result.error) setError(result.error);
    });
  };
  const pullBack = () => {
    startTransition(async () => {
      setError(null);
      const result = await pullBackPlanAction(planId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {status === "DRAFT" && (
        <Button onClick={submit} disabled={pending}>
          {t("submitForApproval")}
        </Button>
      )}
      {status === "REJECTED" && (
        <>
          <Button onClick={resubmit} disabled={pending}>
            {t("resubmit")}
          </Button>
          <Button variant="outline" onClick={pullBack} disabled={pending}>
            {t("pullBack")}
          </Button>
        </>
      )}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
