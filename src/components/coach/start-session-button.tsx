"use client";

import { useTransition, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "@/app/actions/sessions";

export function StartSessionButton({
  groupId,
  scheduledStart,
  label = "Start session",
}: {
  groupId: string;
  scheduledStart: string;
  /** Localized label provided by the parent page; falls back to English. */
  label?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await startSessionAction({ groupId, scheduledStart });
            if (result.error) setError(result.error);
            else if (result.sessionId) router.push(`/coach/sessions/${result.sessionId}`);
          })
        }
      >
        {pending ? "..." : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
