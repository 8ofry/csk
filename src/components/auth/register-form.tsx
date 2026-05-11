"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { registerAction } from "@/app/actions/auth-register";

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tFields = useTranslations("auth.register.fields");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  if (success) {
    return (
      <div className="mt-6 rounded-md border border-csk-gold/40 bg-csk-gold/10 p-4 text-sm">
        <strong>{t("successTitle")}</strong> {t("successBody")}
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await registerAction(fd);
          if (result?.error) setError(result.error);
          else setSuccess(true);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">{tFields("fullNameAr")}</label>
          <input
            name="fullNameAr"
            required
            dir="rtl"
            className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{tFields("fullNameEn")}</label>
          <input
            name="fullNameEn"
            required
            className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{tFields("email")}</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{tFields("phone")}</label>
        <input
          name="phone"
          required
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{tFields("passwordHint")}</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("role")}</label>
        <select
          name="role"
          required
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        >
          <option value="TRAINEE">{t("trainee")}</option>
          <option value="COACH">{t("coach")}</option>
          <option value="INTERN">{t("intern")}</option>
        </select>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-csk-gold py-2 font-semibold text-csk-black hover:bg-csk-goldLight disabled:opacity-50"
      >
        {pending ? "..." : t("submit")}
      </button>
    </form>
  );
}
