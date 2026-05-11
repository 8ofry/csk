"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TARGET_BODY_PARTS,
  TRAINING_UNIT_CATEGORIES,
} from "@/application/training-units/schemas";

export interface TrainingUnitFormProps {
  defaultValues?: {
    nameAr?: string;
    nameEn?: string;
    descriptionAr?: string | null;
    descriptionEn?: string | null;
    category?: string;
    disciplineIds?: string[];
    targetBodyParts?: string[];
    targetSkills?: string[];
    difficulty?: number;
    recommendedDurationSeconds?: number | null;
    recommendedRounds?: number | null;
    recommendedRoundDurationSec?: number | null;
    equipmentRequired?: string[];
    demoMediaUrl?: string | null;
    demoMediaType?: "gif" | "mp4" | null;
    published?: boolean;
  };
  disciplines: { id: string; label: string }[];
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
  showChangeNote?: boolean;
}

export function TrainingUnitForm({
  defaultValues,
  disciplines,
  onSubmit,
  submitLabel,
  showChangeNote,
}: TrainingUnitFormProps) {
  const t = useTranslations("hcUnitForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const checkedDisciplines = new Set(defaultValues?.disciplineIds ?? []);
  const checkedBodyParts = new Set(defaultValues?.targetBodyParts ?? []);

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
          else router.push("/head-coach/training-units");
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameEn">{t("nameEn")}</Label>
          <Input id="nameEn" name="nameEn" required defaultValue={defaultValues?.nameEn} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="nameAr">{t("nameAr")}</Label>
          <Input
            id="nameAr"
            name="nameAr"
            required
            defaultValue={defaultValues?.nameAr}
            className="mt-1"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="descriptionEn">{t("descriptionEn")}</Label>
          <Textarea
            id="descriptionEn"
            name="descriptionEn"
            rows={4}
            defaultValue={defaultValues?.descriptionEn ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="descriptionAr">{t("descriptionAr")}</Label>
          <Textarea
            id="descriptionAr"
            name="descriptionAr"
            rows={4}
            defaultValue={defaultValues?.descriptionAr ?? ""}
            className="mt-1"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="category">{t("category")}</Label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? "technique"}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            {TRAINING_UNIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="difficulty">{t("difficulty")}</Label>
          <Input
            id="difficulty"
            name="difficulty"
            type="number"
            min={1}
            max={5}
            required
            defaultValue={defaultValues?.difficulty ?? 1}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="equipmentRequired">{t("equipment")}</Label>
          <Input
            id="equipmentRequired"
            name="equipmentRequired"
            defaultValue={(defaultValues?.equipmentRequired ?? []).join(", ")}
            placeholder={t("equipmentPlaceholder")}
            className="mt-1"
          />
        </div>
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("disciplines")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {disciplines.map((d) => (
            <label
              key={d.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10"
            >
              <input
                type="checkbox"
                name="disciplineIds"
                value={d.id}
                defaultChecked={checkedDisciplines.has(d.id)}
                className="h-4 w-4 accent-csk-gold"
              />
              {d.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("targetBodyParts")}</legend>
        <div className="mt-2 grid grid-cols-3 gap-2 md:grid-cols-5">
          {TARGET_BODY_PARTS.map((bp) => (
            <label
              key={bp}
              className="flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/10"
            >
              <input
                type="checkbox"
                name="targetBodyParts"
                value={bp}
                defaultChecked={checkedBodyParts.has(bp)}
                className="h-3 w-3 accent-csk-gold"
              />
              {bp.replace(/_/g, " ")}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="targetSkills">{t("targetSkills")}</Label>
        <Input
          id="targetSkills"
          name="targetSkills"
          defaultValue={(defaultValues?.targetSkills ?? []).join(", ")}
          placeholder={t("targetSkillsPlaceholder")}
          className="mt-1"
        />
      </div>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("recommendedDose")}</legend>
        <p className="text-xs text-muted-foreground">{t("doseHint")}</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="recommendedDurationSeconds">{t("durationSec")}</Label>
            <Input
              id="recommendedDurationSeconds"
              name="recommendedDurationSeconds"
              type="number"
              min={0}
              defaultValue={defaultValues?.recommendedDurationSeconds ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="recommendedRounds">{t("rounds")}</Label>
            <Input
              id="recommendedRounds"
              name="recommendedRounds"
              type="number"
              min={0}
              defaultValue={defaultValues?.recommendedRounds ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="recommendedRoundDurationSec">{t("roundDurationSec")}</Label>
            <Input
              id="recommendedRoundDurationSec"
              name="recommendedRoundDurationSec"
              type="number"
              min={0}
              defaultValue={defaultValues?.recommendedRoundDurationSec ?? ""}
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-md border p-4">
        <legend className="px-2 text-sm font-medium">{t("demoMedia")}</legend>
        <p className="text-xs text-muted-foreground">{t("demoMediaHint")}</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Label htmlFor="demoMediaUrl">{t("mediaUrl")}</Label>
            <Input
              id="demoMediaUrl"
              name="demoMediaUrl"
              type="url"
              defaultValue={defaultValues?.demoMediaUrl ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="demoMediaType">{t("mediaType")}</Label>
            <select
              id="demoMediaType"
              name="demoMediaType"
              defaultValue={defaultValues?.demoMediaType ?? ""}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <option value="">—</option>
              <option value="gif">gif</option>
              <option value="mp4">mp4</option>
            </select>
          </div>
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaultValues?.published ?? false}
          className="h-4 w-4 rounded border-input accent-csk-gold"
        />
        {t("publishedLabel")}
      </label>

      {showChangeNote && (
        <div>
          <Label htmlFor="changeNote">{t("changeNote")}</Label>
          <Input id="changeNote" name="changeNote" className="mt-1" placeholder={t("changeNotePlaceholder")} />
        </div>
      )}

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
