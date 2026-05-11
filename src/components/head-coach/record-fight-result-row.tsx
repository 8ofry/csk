"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordFightResultAction } from "@/app/actions/championships";

export function RecordFightResultRow({
  registrations,
}: {
  registrations: { id: string; label: string }[];
}) {
  const t = useTranslations("hcRecordFight");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (registrations.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noConfirmed")}</p>;
  }

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const r = await recordFightResultAction(fd);
          if (r.error) setError(r.error);
          else {
            (e.currentTarget as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="md:col-span-2">
        <Label htmlFor="registrationId">{t("fighter")}</Label>
        <select
          id="registrationId"
          name="registrationId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          {registrations.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="opponentName">{t("opponent")}</Label>
        <Input id="opponentName" name="opponentName" required className="mt-1" />
      </div>
      <div>
        <Label htmlFor="outcome">{t("outcome")}</Label>
        <select
          id="outcome"
          name="outcome"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="WIN">{t("outcomes.win")}</option>
          <option value="LOSS">{t("outcomes.loss")}</option>
          <option value="DRAW">{t("outcomes.draw")}</option>
          <option value="NO_CONTEST">{t("outcomes.noContest")}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="method">{t("method")}</Label>
        <select
          id="method"
          name="method"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">—</option>
          <option value="KO">{t("methods.ko")}</option>
          <option value="TKO">{t("methods.tko")}</option>
          <option value="DECISION">{t("methods.decision")}</option>
          <option value="SUBMISSION">{t("methods.submission")}</option>
          <option value="DQ">{t("methods.dq")}</option>
          <option value="OTHER">{t("methods.other")}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="round">{t("round")}</Label>
        <Input id="round" name="round" type="number" min={1} max={20} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="timeInRound">{t("time")}</Label>
        <Input id="timeInRound" name="timeInRound" placeholder="2:34" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="videoUrl">{t("videoUrl")}</Label>
        <Input id="videoUrl" name="videoUrl" type="url" className="mt-1" />
      </div>
      <div className="md:col-span-3">
        <Label htmlFor="notes">{t("notes")}</Label>
        <Input id="notes" name="notes" className="mt-1" />
      </div>
      {error && <p className="md:col-span-3 text-sm text-destructive">{error}</p>}
      <div className="md:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : t("record")}
        </Button>
      </div>
    </form>
  );
}
