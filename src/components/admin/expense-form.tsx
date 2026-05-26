"use client";

import { useTransition, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logExpenseAction } from "@/app/actions/expenses";

interface CoachOption {
  id: string;
  name: string;
}

export function ExpenseForm({
  coaches = [],
  initialCategory = "RENT",
  initialAmount = "",
  initialRecipientUserId = "",
  initialRecurringExpenseId = "",
  initialDescription = "",
}: {
  coaches?: CoachOption[];
  initialCategory?: string;
  initialAmount?: string;
  initialRecipientUserId?: string;
  initialRecurringExpenseId?: string;
  initialDescription?: string;
}) {
  const t = useTranslations("adminExpenses");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [category, setCategory] = useState(initialCategory);
  const [amount, setAmount] = useState(initialAmount);
  const [method, setMethod] = useState("CASH");
  const [recipientUserId, setRecipientUserId] = useState(initialRecipientUserId);
  const [recurringExpenseId, setRecurringExpenseId] = useState(initialRecurringExpenseId);
  const [description, setDescription] = useState(initialDescription);
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  // Sync props to state if they change
  useEffect(() => {
    setCategory(initialCategory);
    setAmount(initialAmount);
    setRecipientUserId(initialRecipientUserId);
    setRecurringExpenseId(initialRecurringExpenseId);
    setDescription(initialDescription);
  }, [initialCategory, initialAmount, initialRecipientUserId, initialRecurringExpenseId, initialDescription]);

  const showCoachSelector = category === "SALARIES" || category === "COACH_PAYOUT";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await logExpenseAction(fd);
          if (result.error) {
            setError(result.error);
          } else {
            setError(null);
            // reset form
            setAmount("");
            setRecipientUserId("");
            setRecurringExpenseId("");
            setDescription("");
            (e.target as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      {recurringExpenseId && (
        <input type="hidden" name="recurringExpenseId" value={recurringExpenseId} />
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">{t("category")}</Label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (e.target.value !== "SALARIES" && e.target.value !== "COACH_PAYOUT") {
                setRecipientUserId("");
              }
            }}
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
          <Label htmlFor="amount">{t("amount")} (EGP)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>

      {showCoachSelector && (
        <div>
          <Label htmlFor="recipientUserId">{t("coach")}</Label>
          <select
            id="recipientUserId"
            name="recipientUserId"
            value={recipientUserId}
            onChange={(e) => setRecipientUserId(e.target.value)}
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">{t("selectCoach")}</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="method">{t("method")}</Label>
          <select
            id="method"
            name="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
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
          <Label htmlFor="paidAt">{t("paidAt")}</Label>
          <Input
            id="paidAt"
            name="paidAt"
            type="date"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1"
          placeholder="..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "..." : t("submit")}
      </Button>
    </form>
  );
}

