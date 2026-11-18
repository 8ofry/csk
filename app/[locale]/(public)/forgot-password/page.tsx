"use client";

import { useState, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { requestPasswordResetAction } from "@/app/actions/password-reset";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-csk-gold">Reset Password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your account email and we will send you a reset link.
        </p>

        {sent ? (
          <div className="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
            If an active account exists with that email, a reset link has been sent.
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                setError(null);
                const res = await requestPasswordResetAction(fd);
                if (res.error) setError(res.error);
                else setSent(true);
              });
            }}
          >
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
              {pending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <div className="mt-4 text-sm">
          <Link href="/login" className="text-csk-gold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
