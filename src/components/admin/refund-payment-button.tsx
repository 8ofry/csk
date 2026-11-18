"use client";

import { useState, useTransition } from "react";
import { refundPaymentAction } from "@/app/actions/payments";

export function RefundPaymentButton({ paymentId }: { paymentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const reason = window.prompt("Refund reason (optional):") ?? undefined;
          startTransition(async () => {
            setError(null);
            const res = await refundPaymentAction(paymentId, reason);
            if (res.error) setError(res.error);
          });
        }}
        className="rounded border border-destructive/40 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        {pending ? "Refunding..." : "Refund"}
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}
