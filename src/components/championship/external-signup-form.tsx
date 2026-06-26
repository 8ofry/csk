"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { registerExternalAcademyAction } from "@/app/actions/championships";
import { useRouter } from "@/i18n/navigation";

export function ExternalSignupForm() {
  const t = useTranslations("championshipSignup");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (success) {
    return (
      <div className="mt-6 rounded-md border border-csk-gold/40 bg-csk-gold/10 p-4 text-sm text-foreground">
        <strong>{t("success")}</strong>
      </div>
    );
  }

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await registerExternalAcademyAction(fd);
          if (result?.error) {
            setError(result.error);
          } else {
            setSuccess(true);
            setTimeout(() => {
              router.push("/coach");
              router.refresh();
            }, 1500);
          }
        });
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-csk-gold border-b border-muted pb-2">
          {t("academySection")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("academyNameAr")}</label>
            <input
              name="academyNameAr"
              required
              dir="rtl"
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("academyNameEn")}</label>
            <input
              name="academyNameEn"
              required
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-csk-gold border-b border-muted pb-2">
          {t("coachSection")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("fullNameAr")}</label>
            <input
              name="fullNameAr"
              required
              dir="rtl"
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("fullNameEn")}</label>
            <input
              name="fullNameEn"
              required
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t("email")}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t("phone")}</label>
            <input
              name="phone"
              required
              className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("password")}</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-csk-gold py-3 font-semibold text-csk-black hover:bg-csk-goldLight disabled:opacity-50 transition-colors"
      >
        {pending ? "..." : t("submit")}
      </button>
    </form>
  );
}
