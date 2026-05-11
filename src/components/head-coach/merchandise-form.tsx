"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MerchandiseFormProps {
  defaultValues?: {
    nameAr?: string;
    nameEn?: string;
    description?: string | null;
    category?: string;
    photos?: string[];
    variants?: string[];
    costPrice?: number;
    salePrice?: number;
    stockLevel?: number;
    lowStockThreshold?: number;
    active?: boolean;
  };
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function MerchandiseForm({ defaultValues, onSubmit, submitLabel }: MerchandiseFormProps) {
  const t = useTranslations("hcMerchForm");
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
          const r = await onSubmit(fd);
          if (r.error) setError(r.error);
          else router.push("/head-coach/merchandise");
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
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
            dir="rtl"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="category">{t("category")}</Label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? "gloves"}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="gloves">{t("categories.gloves")}</option>
            <option value="protective">{t("categories.protective")}</option>
            <option value="apparel">{t("categories.apparel")}</option>
            <option value="wraps">{t("categories.wraps")}</option>
            <option value="accessories">{t("categories.accessories")}</option>
            <option value="other">{t("categories.other")}</option>
          </select>
        </div>
        <label className="mt-6 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaultValues?.active ?? true}
            className="h-4 w-4 accent-csk-gold"
          />
          {t("active")}
        </label>
      </div>

      <div>
        <Label htmlFor="photos">{t("photoUrls")}</Label>
        <Input
          id="photos"
          name="photos"
          defaultValue={defaultValues?.photos?.join(", ") ?? ""}
          placeholder={t("photoUrlsPlaceholder")}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="variants">{t("variants")}</Label>
        <Input
          id="variants"
          name="variants"
          defaultValue={defaultValues?.variants?.join(", ") ?? ""}
          placeholder={t("variantsPlaceholder")}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <Label htmlFor="costPrice">{t("cost")}</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={defaultValues?.costPrice ?? 0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="salePrice">{t("sale")}</Label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={defaultValues?.salePrice ?? 0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="stockLevel">{t("stock")}</Label>
          <Input
            id="stockLevel"
            name="stockLevel"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.stockLevel ?? 0}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="lowStockThreshold">{t("lowStockAt")}</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min={0}
            required
            defaultValue={defaultValues?.lowStockThreshold ?? 5}
            className="mt-1"
          />
        </div>
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
