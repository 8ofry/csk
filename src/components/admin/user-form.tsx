"use client";

import { useTransition, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface UserFormProps {
  defaultValues?: {
    fullNameAr?: string;
    fullNameEn?: string;
    phone?: string;
    email?: string;
    role?: string;
    status?: string;
    parentManaged?: boolean;
  };
  onSubmit: (formData: FormData) => Promise<{ ok?: true; id?: string; error?: string }>;
  submitLabel: string;
}

export function UserForm({ defaultValues, onSubmit, submitLabel }: UserFormProps) {
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isEdit = !!defaultValues;

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
          else router.push("/admin/users");
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullNameEn">{t("form.fullNameEn")}</Label>
          <Input
            id="fullNameEn"
            name="fullNameEn"
            required
            defaultValue={defaultValues?.fullNameEn}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="fullNameAr">{t("form.fullNameAr")}</Label>
          <Input
            id="fullNameAr"
            name="fullNameAr"
            required
            defaultValue={defaultValues?.fullNameAr}
            className="mt-1 text-right"
            dir="rtl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">{t("form.phone")}</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={defaultValues?.phone}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">{t("form.email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues?.email?.endsWith("@phone.csk.local") ? "" : defaultValues?.email}
            placeholder={t("form.emailHint")}
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="password">
            {isEdit ? "New Password (optional)" : "Password (optional)"}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={isEdit ? "Leave blank to keep unchanged" : "Leave blank to keep empty"}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="role">{t("form.role")}</Label>
            <select
              id="role"
              name="role"
              defaultValue={defaultValues?.role ?? "TRAINEE"}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <option value="TRAINEE">TRAINEE</option>
              <option value="INTERN">INTERN</option>
              <option value="COACH">COACH</option>
              <option value="HEAD_COACH">HEAD_COACH</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <Label htmlFor="status">{t("form.status")}</Label>
            <select
              id="status"
              name="status"
              defaultValue={defaultValues?.status ?? "ACTIVE"}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="parentManaged"
          defaultChecked={defaultValues?.parentManaged ?? false}
          className="h-4 w-4 rounded border-input accent-csk-gold"
        />
        {t("form.parentManaged")}
      </label>

      {error && <p className="text-sm text-destructive">❌ {error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
