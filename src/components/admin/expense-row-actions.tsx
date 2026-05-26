"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { deleteExpenseAction } from "@/app/actions/expenses";

export function ExpenseRowActions({ expenseId }: { expenseId: string }) {
  const t = useTranslations("adminExpenses");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 justify-end">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!confirm(t("deleteConfirm"))) return;
          startTransition(async () => {
            setError(null);
            const r = await deleteExpenseAction(expenseId);
            if (r.error) {
              setError(r.error);
            } else {
              router.refresh();
            }
          });
        }}
      >
        {pending ? "..." : t("delete")}
      </Button>
    </div>
  );
}
