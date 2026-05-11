"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signInAction } from "@/app/actions/auth";

export function LoginForm() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await signInAction(fd);
          if (result?.error) {
            setError(result.error);
          } else if (result?.redirectTo) {
            router.push(result.redirectTo as Parameters<typeof router.push>[0]);
          }
        });
      }}
    >
      <div>
        <label htmlFor="identifier" className="mb-1 block text-sm font-medium">
          {t("emailOrPhone")}
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
        />
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
