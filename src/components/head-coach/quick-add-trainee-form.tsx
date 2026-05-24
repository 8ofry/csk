"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { quickAddTraineeAction } from "@/app/actions/trainees";

export function QuickAddTraineeForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      setError(null);
      setSuccess(null);
      const result = await quickAddTraineeAction(fd);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Trainee added successfully! You can now enroll them in a group.");
        form.reset();
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullNameAr">الاسم بالعربي</Label>
          <Input
            id="fullNameAr"
            name="fullNameAr"
            placeholder="محمد أحمد"
            required
            minLength={2}
            className="mt-1 text-right"
            dir="rtl"
          />
        </div>
        <div>
          <Label htmlFor="fullNameEn">Name (English)</Label>
          <Input
            id="fullNameEn"
            name="fullNameEn"
            placeholder="Mohamed Ahmed"
            required
            minLength={2}
            className="mt-1"
          />
        </div>
      </div>

      <div className="max-w-xs">
        <Label htmlFor="phone">Phone Number (Mobile)</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+20 1XX XXX XXXX"
          required
          minLength={7}
          className="mt-1 font-mono"
          dir="ltr"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          This will be the trainee&apos;s login identifier until they set up an email.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="parentManaged"
          className="h-4 w-4 rounded accent-csk-gold"
        />
        <span>Parent-managed account (minor trainee)</span>
      </label>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ❌ {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          ✅ {success}
        </p>
      )}

      <Button type="submit" disabled={pending} className="min-w-32">
        {pending ? "Adding..." : "Add Trainee"}
      </Button>
    </form>
  );
}
