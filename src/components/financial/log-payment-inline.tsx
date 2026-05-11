"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logSubscriptionPaymentAction } from "@/app/actions/payments";

export function LogPaymentInline({
  subscriptionId,
  payerUserId,
  defaultAmount,
}: {
  subscriptionId: string;
  payerUserId: string;
  defaultAmount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  if (receipt) {
    return (
      <div className="text-xs text-muted-foreground">
        Receipt <code className="rounded bg-muted px-1 py-0.5">{receipt}</code>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Log payment
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("subscriptionId", subscriptionId);
        fd.set("payerUserId", payerUserId);
        startTransition(async () => {
          setError(null);
          const result = await logSubscriptionPaymentAction(fd);
          if (result.error) setError(result.error);
          else if (result.receiptNumber) {
            setReceipt(result.receiptNumber);
            router.refresh();
          }
        });
      }}
    >
      <Input
        name="amountGross"
        type="number"
        step="0.01"
        min={0.01}
        defaultValue={defaultAmount}
        required
        className="h-9 w-28"
        aria-label="Amount"
      />
      <select
        name="method"
        defaultValue="CASH"
        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        aria-label="Method"
      >
        <option value="CASH">Cash</option>
        <option value="VODAFONE_CASH">Vodafone Cash</option>
        <option value="BANK_TRANSFER">Bank transfer</option>
      </select>
      <Button size="sm" type="submit" disabled={pending}>
        {pending ? "..." : "Log"}
      </Button>
      <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
