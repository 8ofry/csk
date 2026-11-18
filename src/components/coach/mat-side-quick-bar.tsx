"use client";

import { useState, useTransition } from "react";
import { markAllPresentAction } from "@/app/actions/sessions";

export function MatSideQuickBar({
  sessionId,
  traineeIds,
}: {
  sessionId: string;
  traineeIds: string[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (traineeIds.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-csk-gold/40 bg-csk-gold/5 px-4 py-3">
      <div className="text-sm">
        <span className="font-semibold text-csk-gold">Mat-Side Quick Mode:</span>{" "}
        <span className="text-muted-foreground">
          Mark all {traineeIds.length} enrolled trainees Present in one tap, then adjust exceptions.
        </span>
      </div>
      <div className="flex items-center gap-3">
        {msg && <span className="text-xs text-emerald-500">{msg}</span>}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              setMsg(null);
              const res = await markAllPresentAction(sessionId, traineeIds);
              if (res.error) setMsg(res.error);
              else setMsg("All marked Present");
            });
          }}
          className="rounded-md bg-csk-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-csk-gold/90 disabled:opacity-50"
        >
          {pending ? "Marking..." : "Mark All Present"}
        </button>
      </div>
    </div>
  );
}
