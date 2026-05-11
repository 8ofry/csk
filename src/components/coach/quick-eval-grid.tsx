"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertQuickEvalAction } from "@/app/actions/sessions";

interface EvalRow {
  traineeId: string;
  fullNameEn: string;
  fullNameAr: string;
  current?: {
    effortScore: number;
    notes: string | null;
    flaggedBodyPart: string | null;
    flaggedSkill: string | null;
  };
}

export function QuickEvalGrid({
  sessionId,
  trainees,
}: {
  sessionId: string;
  trainees: EvalRow[];
}) {
  return (
    <ul className="space-y-3">
      {trainees.map((t) => (
        <li key={t.traineeId} className="rounded-md border p-3">
          <QuickEvalForm sessionId={sessionId} row={t} />
        </li>
      ))}
    </ul>
  );
}

function QuickEvalForm({ sessionId, row }: { sessionId: string; row: EvalRow }) {
  const t = useTranslations("coachQuickEval");
  const tBadges = useTranslations("badges");
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await upsertQuickEvalAction(sessionId, fd);
          if (result.error) setError(result.error);
          else setSavedAt(new Date());
        });
      }}
      className="space-y-3"
    >
      <input type="hidden" name="traineeId" value={row.traineeId} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{row.fullNameEn}</div>
          <div className="text-xs text-muted-foreground">{row.fullNameAr}</div>
        </div>
        {savedAt && <Badge variant="success">{tBadges("saved")}</Badge>}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("effortLabel")}
        </label>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <label
              key={n}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium has-[:checked]:border-csk-gold has-[:checked]:bg-csk-gold/20 has-[:checked]:text-csk-gold"
            >
              <input
                type="radio"
                name="effortScore"
                value={n}
                defaultChecked={row.current?.effortScore === n}
                required
                className="sr-only"
              />
              {n}
            </label>
          ))}
        </div>
      </div>

      <Textarea
        name="notes"
        rows={2}
        placeholder={t("notesPlaceholder")}
        defaultValue={row.current?.notes ?? ""}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input
          name="flaggedBodyPart"
          placeholder={t("bodyPartPlaceholder")}
          defaultValue={row.current?.flaggedBodyPart ?? ""}
        />
        <Input
          name="flaggedSkill"
          placeholder={t("skillPlaceholder")}
          defaultValue={row.current?.flaggedSkill ?? ""}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="sm" disabled={pending} className="w-full sm:w-auto">
        {pending ? "..." : t("saveBtn")}
      </Button>
    </form>
  );
}
