"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SubscriptionFormProps {
  trainees: { id: string; label: string }[];
  groups: { id: string; label: string }[];
  defaultStartMonth: string;
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
}

export function SubscriptionForm({
  trainees,
  groups,
  defaultStartMonth,
  onSubmit,
}: SubscriptionFormProps) {
  const t = useTranslations("hcSubsForm");
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
          const result = await onSubmit(fd);
          if (result.error) setError(result.error);
          else router.push("/head-coach/subscriptions");
        });
      }}
    >
      <div>
        <Label htmlFor="traineeId">{t("trainee")}</Label>
        <select
          id="traineeId"
          name="traineeId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">{t("pickPlaceholder")}</option>
          {trainees.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="groupId">{t("group")}</Label>
        <select
          id="groupId"
          name="groupId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">{t("pickPlaceholder")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="monthlyFee">{t("monthlyFee")}</Label>
          <Input
            id="monthlyFee"
            name="monthlyFee"
            type="number"
            step="0.01"
            min={0}
            required
            placeholder={t("monthlyFeePlaceholder")}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="sessionsPerMonth">{t("sessionsMonth")}</Label>
          <Input
            id="sessionsPerMonth"
            name="sessionsPerMonth"
            type="number"
            min={1}
            max={60}
            defaultValue={12}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startMonth">{t("startMonth")}</Label>
          <Input
            id="startMonth"
            name="startMonth"
            type="month"
            required
            defaultValue={defaultStartMonth}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="discountPercent">{t("discountPercent")}</Label>
          <Input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="discountReason">{t("discountReason")}</Label>
        <Input
          id="discountReason"
          name="discountReason"
          placeholder={t("discountReasonPlaceholder")}
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : t("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
