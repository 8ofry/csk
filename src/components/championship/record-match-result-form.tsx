"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordMatchResultAction } from "@/app/actions/championships";

interface RecordMatchResultFormProps {
  match: {
    id: string;
    championshipId: string;
    fighter1Id: string;
    fighter2Id: string;
    fighter1: { trainee: { fullNameEn: string; fullNameAr: string } };
    fighter2: { trainee: { fullNameEn: string; fullNameAr: string } };
  };
  onSuccess: () => void;
}

export function RecordMatchResultForm({ match, onSuccess }: RecordMatchResultFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.append("matchId", match.id);
    fd.append("championshipId", match.championshipId);

    // If "draw" is selected as winner, make sure winnerId is not passed as cuid
    const winnerIdValue = fd.get("winnerId");
    if (winnerIdValue === "draw" || !winnerIdValue) {
      fd.delete("winnerId");
    }

    startTransition(async () => {
      setError(null);
      const res = await recordMatchResultAction(fd);
      if (res?.error) {
        setError(res.error);
      } else {
        onSuccess();
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-white">
      <div>
        <Label htmlFor="winnerId" className="text-neutral-200">Winner</Label>
        <select
          id="winnerId"
          name="winnerId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 text-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="" className="bg-neutral-850 text-neutral-300">— Pick Winner —</option>
          <option value={match.fighter1Id} className="bg-neutral-850 text-white">{match.fighter1.trainee.fullNameEn}</option>
          <option value={match.fighter2Id} className="bg-neutral-850 text-white">{match.fighter2.trainee.fullNameEn}</option>
          <option value="draw" className="bg-neutral-850 text-white">Draw / No Winner</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="outcome" className="text-neutral-200">Outcome</Label>
          <select
            id="outcome"
            name="outcome"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 text-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="WIN" className="bg-neutral-850 text-white">WIN/LOSS</option>
            <option value="DRAW" className="bg-neutral-850 text-white">DRAW</option>
            <option value="NO_CONTEST" className="bg-neutral-850 text-white">NO CONTEST</option>
          </select>
        </div>
        <div>
          <Label htmlFor="method" className="text-neutral-200">Method</Label>
          <select
            id="method"
            name="method"
            className="mt-1 flex h-10 w-full rounded-md border border-neutral-700 bg-neutral-800 text-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="" className="bg-neutral-850 text-neutral-300">—</option>
            <option value="KO" className="bg-neutral-850 text-white">KO</option>
            <option value="TKO" className="bg-neutral-850 text-white">TKO</option>
            <option value="DECISION" className="bg-neutral-850 text-white">DECISION</option>
            <option value="SUBMISSION" className="bg-neutral-850 text-white">SUBMISSION</option>
            <option value="DQ" className="bg-neutral-850 text-white">DQ</option>
            <option value="OTHER" className="bg-neutral-850 text-white">OTHER</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="round" className="text-neutral-200">Round</Label>
          <Input id="round" name="round" type="number" min={1} max={10} className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder:text-neutral-500 focus-visible:ring-csk-gold" />
        </div>
        <div>
          <Label htmlFor="timeInRound" className="text-neutral-200">Time in Round</Label>
          <Input id="timeInRound" name="timeInRound" placeholder="e.g. 1:45" className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder:text-neutral-500 focus-visible:ring-csk-gold" />
        </div>
      </div>

      <div>
        <Label htmlFor="videoUrl" className="text-neutral-200">Match Video URL (YouTube/Vimeo)</Label>
        <Input id="videoUrl" name="videoUrl" type="url" placeholder="https://youtube.com/watch?v=..." className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder:text-neutral-500 focus-visible:ring-csk-gold" />
      </div>

      <div>
        <Label htmlFor="notes" className="text-neutral-200">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional notes" className="mt-1 bg-neutral-800 text-white border-neutral-700 placeholder:text-neutral-500 focus-visible:ring-csk-gold" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending} className="bg-csk-gold text-csk-black hover:bg-csk-goldLight font-bold">
          {pending ? "Saving..." : "Save Match Result"}
        </Button>
      </div>
    </form>
  );
}
