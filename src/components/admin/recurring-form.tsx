"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRecurringExpenseAction } from "@/app/actions/expenses";

export function RecurringForm() {
  const t = useTranslations("adminExpenses");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createRecurringExpenseAction(fd);
          if (result.error) {
            setError(result.error);
          } else {
            setError(null);
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rec-category">{t("category")}</Label>
          <select
            id="rec-category"
            name="category"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="RENT">{t("categories.RENT")}</option>
            <option value="SALARIES">{t("categories.SALARIES")}</option>
            <option value="COACH_PAYOUT">{t("categories.COACH_PAYOUT")}</option>
            <option value="UTILITIES">{t("categories.UTILITIES")}</option>
            <option value="EQUIPMENT">{t("categories.EQUIPMENT")}</option>
            <option value="MARKETING">{t("categories.MARKETING")}</option>
            <option value="MAINTENANCE">{t("categories.MAINTENANCE")}</option>
            <option value="SUPPLIES">{t("categories.SUPPLIES")}</option>
            <option value="TAXES">{t("categories.TAXES")}</option>
            <option value="OTHER">{t("categories.OTHER")}</option>
          </select>
        </div>

        <div>
          <Label htmlFor="rec-amount">{t("amount")} (EGP)</Label>
          <Input
            id="rec-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="rec-method">{t("method")}</Label>
          <select
            id="rec-method"
            name="method"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="CASH">CASH</option>
            <option value="VODAFONE_CASH">VODAFONE CASH</option>
            <option value="BANK_TRANSFER">BANK TRANSFER</option>
            <option value="ONLINE">ONLINE</option>
          </select>
        </div>

        <div>
          <Label htmlFor="rec-dayOfMonth">{t("recurring.dayOfMonth") || "Day of Month"}</Label>
          <Input
            id="rec-dayOfMonth"
            name="dayOfMonth"
            type="number"
            min="1"
            max="31"
            required
            defaultValue="1"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rec-description">{t("description")}</Label>
        <Textarea
          id="rec-description"
          name="description"
          rows={2}
          className="mt-1"
          placeholder="..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "..." : t("recurring.create") || "Create Rule"}
      </Button>
    </form>
  );
}
