"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { optInChampionshipAction } from "@/app/actions/championships";

export function OptInButton({
  championshipId,
  label = "Opt in",
}: {
  championshipId: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 rounded-md border bg-card p-3 text-start"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("championshipId", championshipId);
        startTransition(async () => {
          setError(null);
          const r = await optInChampionshipAction(fd);
          if (r.error) setError(r.error);
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input
            id="weightKg"
            name="weightKg"
            type="number"
            step="0.1"
            min={20}
            max={250}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="level">Level</Label>
          <select
            id="level"
            name="level"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">—</option>
            <option value="N">N</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="targetWeightClass">Target weight class</Label>
        <Input id="targetWeightClass" name="targetWeightClass" placeholder="e.g. 65kg" className="mt-1" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "..." : "Confirm opt-in"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
