"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { runMatchmakingAction } from "@/app/actions/championships";

export function RunMatchmakingButton({ championshipId }: { championshipId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        disabled={pending}
        className="bg-csk-gold text-csk-black hover:bg-csk-goldLight font-bold"
        onClick={() => {
          if (confirm("Are you sure you want to run the automated matchmaking engine? This will regenerate all matches for this tournament!")) {
            startTransition(async () => {
              setError(null);
              const r = await runMatchmakingAction(championshipId);
              if (r.error) setError(r.error);
              else router.refresh();
            });
          }
        }}
      >
        {pending ? "Pairing Fighters..." : "Run Matchmaking Engine"}
      </Button>
      {error && <div className="mt-1 text-xs text-destructive font-semibold">{error}</div>}
    </div>
  );
}
