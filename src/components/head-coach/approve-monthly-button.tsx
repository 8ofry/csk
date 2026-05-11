"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { approveMonthlyReportAction } from "@/app/actions/monthly-reports";

export function ApproveMonthlyButton({
  reportId,
  label = "Approve & deliver",
}: {
  reportId: string;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await approveMonthlyReportAction(reportId);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
      >
        {pending ? "..." : label}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </>
  );
}
