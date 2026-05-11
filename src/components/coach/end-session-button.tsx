"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { endSessionAction } from "@/app/actions/sessions";

export function EndSessionButton({
  sessionId,
  label = "End session",
}: {
  sessionId: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() => {
          if (!confirm(`${label}?`)) return;
          startTransition(async () => {
            setError(null);
            const result = await endSessionAction(sessionId);
            if (result.error) setError(result.error);
          });
        }}
      >
        {pending ? "..." : label}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </>
  );
}
