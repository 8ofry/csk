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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="winnerId">Winner</Label>
        <select
          id="winnerId"
          name="winnerId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">— Pick Winner —</option>
          <option value={match.fighter1Id}>{match.fighter1.trainee.fullNameEn}</option>
          <option value={match.fighter2Id}>{match.fighter2.trainee.fullNameEn}</option>
          <option value="draw">Draw / No Winner</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="outcome">Outcome</Label>
          <select
            id="outcome"
            name="outcome"
            required
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="WIN">WIN/LOSS</option>
            <option value="DRAW">DRAW</option>
            <option value="NO_CONTEST">NO CONTEST</option>
          </select>
        </div>
        <div>
          <Label htmlFor="method">Method</Label>
          <select
            id="method"
            name="method"
            className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
          >
            <option value="">—</option>
            <option value="KO">KO</option>
            <option value="TKO">TKO</option>
            <option value="DECISION">DECISION</option>
            <option value="SUBMISSION">SUBMISSION</option>
            <option value="DQ">DQ</option>
            <option value="OTHER">OTHER</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="round">Round</Label>
          <Input id="round" name="round" type="number" min={1} max={10} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="timeInRound">Time in Round</Label>
          <Input id="timeInRound" name="timeInRound" placeholder="e.g. 1:45" className="mt-1" />
        </div>
      </div>

      <div>
        <Label htmlFor="videoUrl">Match Video URL (YouTube/Vimeo)</Label>
        <Input id="videoUrl" name="videoUrl" type="url" placeholder="https://youtube.com/watch?v=..." className="mt-1" />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Optional notes" className="mt-1" />
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
