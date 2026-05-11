"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ContractFormProps {
  coaches: { id: string; label: string }[];
  locations: { id: string; label: string }[];
  disciplines: { id: string; label: string }[];
  defaultValues?: {
    coachId?: string;
    locationId?: string | null;
    disciplineId?: string | null;
    subscriptionPercent?: number | null;
    privateSessionPercent?: number | null;
    privateSessionFixedRate?: number | null;
    beltExamPercent?: number | null;
    championshipPercent?: number | null;
    effectiveFrom?: string;
    effectiveTo?: string | null;
    notes?: string | null;
  };
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function ContractForm({
  coaches,
  locations,
  disciplines,
  defaultValues,
  onSubmit,
  submitLabel,
}: ContractFormProps) {
  const t = useTranslations("adminContractForm");
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
          else router.push("/admin/contracts");
        });
      }}
    >
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor="coachId">{t("coach")}</Label>
          <select
            id="coachId"
            name="coachId"
            required
            defaultValue={defaultValues?.coachId}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">{t("pickPlaceholder")}</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="locationId">{t("locationOpt")}</Label>
          <select
            id="locationId"
            name="locationId"
            defaultValue={defaultValues?.locationId ?? ""}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">{t("allOption")}</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="disciplineId">{t("disciplineOpt")}</Label>
          <select
            id="disciplineId"
            name="disciplineId"
            defaultValue={defaultValues?.disciplineId ?? ""}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">{t("allOption")}</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("streamOverrides")}</legend>
        <p className="mb-3 text-xs text-muted-foreground">{t("streamHint")}</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <Label htmlFor="subscriptionPercent">{t("subscriptionPercent")}</Label>
            <Input
              id="subscriptionPercent"
              name="subscriptionPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={defaultValues?.subscriptionPercent ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="privateSessionPercent">{t("privatePercent")}</Label>
            <Input
              id="privateSessionPercent"
              name="privateSessionPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={defaultValues?.privateSessionPercent ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="privateSessionFixedRate">{t("privateFixed")}</Label>
            <Input
              id="privateSessionFixedRate"
              name="privateSessionFixedRate"
              type="number"
              min={0}
              step="0.01"
              defaultValue={defaultValues?.privateSessionFixedRate ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="beltExamPercent">{t("beltPercent")}</Label>
            <Input
              id="beltExamPercent"
              name="beltExamPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={defaultValues?.beltExamPercent ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="championshipPercent">{t("champPercent")}</Label>
            <Input
              id="championshipPercent"
              name="championshipPercent"
              type="number"
              min={0}
              max={100}
              step="0.01"
              defaultValue={defaultValues?.championshipPercent ?? ""}
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="effectiveFrom">{t("effectiveFrom")}</Label>
          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            defaultValue={defaultValues?.effectiveFrom ?? new Date().toISOString().slice(0, 10)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="effectiveTo">{t("effectiveTo")}</Label>
          <Input
            id="effectiveTo"
            name="effectiveTo"
            type="date"
            defaultValue={defaultValues?.effectiveTo ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">{t("notes")}</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? ""}
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
