"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DisciplineFormProps {
  defaultValues?: {
    nameAr?: string;
    nameEn?: string;
    category?: string;
    skills?: string[];
    active?: boolean;
  };
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function DisciplineForm({ defaultValues, onSubmit, submitLabel }: DisciplineFormProps) {
  const t = useTranslations("adminDisciplineForm");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
          else router.push("/admin/disciplines");
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

      <div>
        <Label htmlFor="category">{t("category")}</Label>
        <select
          id="category"
          name="category"
          defaultValue={defaultValues?.category ?? "OTHER"}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="BOXING">{t("categories.boxing")}</option>
          <option value="KICKBOXING">{t("categories.kickboxing")}</option>
          <option value="MMA">{t("categories.mma")}</option>
          <option value="KARATE">{t("categories.karate")}</option>
          <option value="FITNESS">{t("categories.fitness")}</option>
          <option value="OTHER">{t("categories.other")}</option>
        </select>
      </div>

      <div>
        <Label htmlFor="skills">
          {t("skillsTaxonomy")}{" "}
          <span className="text-xs text-muted-foreground">{t("skillsHint")}</span>
        </Label>
        <Textarea
          id="skills"
          name="skills"
          required
          rows={5}
          defaultValue={defaultValues?.skills?.join(", ") ?? ""}
          className="mt-1"
          placeholder={t("skillsPlaceholder")}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaultValues?.active ?? true}
          className="h-4 w-4 rounded border-input accent-csk-gold"
        />
        {t("active")}
      </label>

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
