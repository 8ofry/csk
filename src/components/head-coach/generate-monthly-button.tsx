"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateMonthlyReportAction } from "@/app/actions/monthly-reports";

export function GenerateMonthlyButton({
  trainees,
  defaultYear,
  defaultMonth,
  generateLabel,
}: {
  trainees: { id: string; label: string }[];
  defaultYear: number;
  defaultMonth: number;
  generateLabel?: string;
}) {
  const t = useTranslations("hcGenerateMonthly");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [traineeId, setTraineeId] = useState(trainees[0]?.id ?? "");
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const submitLabel = generateLabel ?? t("defaultLabel");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
      <div>
        <Label htmlFor="trainee">{t("traineeLabel")}</Label>
        <select
          id="trainee"
          value={traineeId}
          onChange={(e) => setTraineeId(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          {trainees.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="year">{t("yearLabel")}</Label>
        <Input
          id="year"
          type="number"
          min={2024}
          max={2099}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="month">{t("monthLabel")}</Label>
        <Input
          id="month"
          type="number"
          min={1}
          max={12}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="mt-1"
        />
      </div>
      <div className="flex items-end">
        <Button
          disabled={pending || !traineeId}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const r = await generateMonthlyReportAction({ traineeId, year, month });
              if (r.error) setError(r.error);
              else router.refresh();
            })
          }
        >
          {pending ? "..." : submitLabel}
        </Button>
      </div>
      {error && <p className="col-span-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
