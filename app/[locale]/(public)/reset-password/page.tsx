"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { resetPasswordAction } from "@/app/actions/password-reset";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-csk-gold">Choose New Password</h1>

        {done ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              Your password has been updated. You can now sign in.
            </div>
            <Link
              href="/login"
              className="inline-block rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-black hover:bg-csk-gold/90"
            >
              Sign In
            </Link>
          </div>
        ) : !token ? (
          <p className="mt-4 text-sm text-destructive">
            Missing reset token. Please use the link from your email.
          </p>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              fd.set("token", token);
              startTransition(async () => {
                setError(null);
                const res = await resetPasswordAction(fd);
                if (res.error) setError(res.error);
                else setDone(true);
              });
            }}
          >
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                className="w-full rounded-md border bg-background px-3 py-2 focus:border-csk-gold focus:outline-none focus:ring-1 focus:ring-csk-gold"
              />
            </div>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-black hover:bg-csk-gold/90 disabled:opacity-60"
            >
              {pending ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
