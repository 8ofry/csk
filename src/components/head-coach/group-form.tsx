"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

interface OptionList {
  id: string;
  label: string;
}

export interface GroupFormProps {
  defaultValues?: {
    name?: string;
    locationId?: string;
    disciplineId?: string;
    primaryCoachId?: string | null;
    internId?: string | null;
    levelBand?: string | null;
    ageBandMin?: number | null;
    ageBandMax?: number | null;
    schedule?: { days?: string[]; startTime?: string; endTime?: string };
    capacity?: number;
    active?: boolean;
  };
  locations: OptionList[];
  disciplines: OptionList[];
  coaches: OptionList[];
  interns: OptionList[];
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function GroupForm({
  defaultValues,
  locations,
  disciplines,
  coaches,
  interns,
  onSubmit,
  submitLabel,
}: GroupFormProps) {
  const t = useTranslations("hcGroupForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const initialDays = new Set(defaultValues?.schedule?.days ?? []);

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await onSubmit(fd);
          if (result.error) setError(result.error);
          else router.push("/head-coach/groups");
        });
      }}
    >
      <div>
        <Label htmlFor="name">{t("groupName")}</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          placeholder={t("groupNamePlaceholder")}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="locationId">{t("location")}</Label>
          <SelectField
            id="locationId"
            name="locationId"
            defaultValue={defaultValues?.locationId}
            options={locations}
            required
          />
        </div>
        <div>
          <Label htmlFor="disciplineId">{t("discipline")}</Label>
          <SelectField
            id="disciplineId"
            name="disciplineId"
            defaultValue={defaultValues?.disciplineId}
            options={disciplines}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primaryCoachId">{t("primaryCoach")}</Label>
          <SelectField
            id="primaryCoachId"
            name="primaryCoachId"
            defaultValue={defaultValues?.primaryCoachId ?? ""}
            options={[{ id: "", label: t("noneYet") }, ...coaches]}
          />
        </div>
        <div>
          <Label htmlFor="internId">{t("internOpt")}</Label>
          <SelectField
            id="internId"
            name="internId"
            defaultValue={defaultValues?.internId ?? ""}
            options={[{ id: "", label: t("none") }, ...interns]}
          />
        </div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("weeklySchedule")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DAY_KEYS.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10"
            >
              <input
                type="checkbox"
                name="days"
                value={key}
                defaultChecked={initialDays.has(key)}
                className="h-4 w-4 accent-csk-gold"
              />
              {t(`days.${key}`)}
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startTime">{t("startTime")}</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={defaultValues?.schedule?.startTime ?? "18:00"}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="endTime">{t("endTime")}</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={defaultValues?.schedule?.endTime ?? "19:30"}
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="levelBand">{t("levelBand")}</Label>
          <SelectField
            id="levelBand"
            name="levelBand"
            defaultValue={defaultValues?.levelBand ?? ""}
            options={[
              { id: "", label: t("any") },
              { id: "N", label: t("newbie") },
              { id: "A", label: "A" },
              { id: "B", label: "B" },
              { id: "C", label: "C" },
            ]}
          />
        </div>
        <div>
          <Label htmlFor="ageBandMin">{t("ageMin")}</Label>
          <Input
            id="ageBandMin"
            name="ageBandMin"
            type="number"
            min={0}
            max={120}
            defaultValue={defaultValues?.ageBandMin ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ageBandMax">{t("ageMax")}</Label>
          <Input
            id="ageBandMax"
            name="ageBandMax"
            type="number"
            min={0}
            max={120}
            defaultValue={defaultValues?.ageBandMax ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="capacity">
            {t("capacity")}{" "}
            <span className="text-xs text-muted-foreground">{t("capacityHint")}</span>
          </Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={200}
            defaultValue={defaultValues?.capacity ?? 20}
            className="mt-1"
          />
        </div>
        <label className="flex items-end gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active ?? true}
            className="h-4 w-4 rounded border-input accent-csk-gold"
          />
          {t("active")}
        </label>
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

function SelectField({
  id,
  name,
  defaultValue,
  options,
  required,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  options: OptionList[];
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue}
      className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
    >
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
