"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LocationFormProps {
  defaultValues?: {
    nameAr?: string;
    nameEn?: string;
    district?: string;
    address?: string;
    latitude?: number | null;
    longitude?: number | null;
    ownership?: string;
    contactPerson?: string | null;
    contactPhone?: string | null;
    active?: boolean;
  };
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function LocationForm({ defaultValues, onSubmit, submitLabel }: LocationFormProps) {
  const t = useTranslations("adminLocationForm");
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
          else router.push("/admin/locations");
        });
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nameEn">{t("nameEn")}</Label>
          <Input
            id="nameEn"
            name="nameEn"
            required
            defaultValue={defaultValues?.nameEn}
            className="mt-1"
          />
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
          <Label htmlFor="district">{t("district")}</Label>
          <Input
            id="district"
            name="district"
            required
            defaultValue={defaultValues?.district}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="ownership">{t("ownership")}</Label>
          <select
            id="ownership"
            name="ownership"
            defaultValue={defaultValues?.ownership ?? "PARTNER"}
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="CSK_OWNED">{t("ownerships.cskOwned")}</option>
            <option value="PARTNER">{t("ownerships.partner")}</option>
            <option value="PATRONAGE">{t("ownerships.patronage")}</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="address">{t("address")}</Label>
        <Input
          id="address"
          name="address"
          required
          defaultValue={defaultValues?.address}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">{t("latitudeOpt")}</Label>
          <Input
            id="latitude"
            name="latitude"
            type="number"
            step="0.0000001"
            defaultValue={defaultValues?.latitude ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="longitude">{t("longitudeOpt")}</Label>
          <Input
            id="longitude"
            name="longitude"
            type="number"
            step="0.0000001"
            defaultValue={defaultValues?.longitude ?? ""}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">{t("contactPerson")}</Label>
          <Input
            id="contactPerson"
            name="contactPerson"
            defaultValue={defaultValues?.contactPerson ?? ""}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={defaultValues?.contactPhone ?? ""}
            className="mt-1"
          />
        </div>
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
