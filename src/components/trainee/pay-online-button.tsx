"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startSubscriptionPaymentAction } from "@/app/actions/payment-intents";

export function PayOnlineButton({ subscriptionId }: { subscriptionId: string }) {
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
            const r = await startSubscriptionPaymentAction(subscriptionId);
            if (r.error) {
              setError(r.error);
            } else if (r.redirectUrl) {
              window.location.href = r.redirectUrl;
            }
          })
        }
      >
        {pending ? "Redirecting…" : "Pay online"}
      </Button>
      {error && <span className="ms-2 text-xs text-destructive">{error}</span>}
    </>
  );
}
