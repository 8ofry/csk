"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { verifyPaymentAction } from "@/app/actions/championships";

export function VerifyPaymentButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        className="bg-green-600 text-white hover:bg-green-700 font-semibold"
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await verifyPaymentAction(registrationId);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
      >
        {pending ? "..." : "Verify Payment"}
      </Button>
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </>
  );
}
