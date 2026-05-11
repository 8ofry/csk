"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ensureDailyReportAction } from "@/app/actions/daily-reports";

export function ComposeReportButton({
  sessionId,
  label = "Compose daily report",
}: {
  sessionId: string;
  label?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await ensureDailyReportAction(sessionId);
            if (result.error) setError(result.error);
            else if (result.reportId) router.push(`/coach/daily-reports/${result.reportId}`);
          })
        }
      >
        {pending ? "..." : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  );
}
