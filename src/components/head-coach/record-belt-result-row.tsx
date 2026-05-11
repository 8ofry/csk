"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recordBeltResultAction } from "@/app/actions/belt-exams";

export function RecordResultRow({
  examId,
  trainees,
}: {
  examId: string;
  trainees: { id: string; label: string }[];
}) {
  const t = useTranslations("hcRecordBelt");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("examId", examId);
        startTransition(async () => {
          setError(null);
          const r = await recordBeltResultAction(fd);
          if (r.error) setError(r.error);
          else {
            (e.currentTarget as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div className="md:col-span-2">
        <Label htmlFor="traineeId">{t("trainee")}</Label>
        <select
          id="traineeId"
          name="traineeId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">{t("pickPlaceholder")}</option>
          {trainees.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="result">{t("result")}</Label>
        <select
          id="result"
          name="result"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="PASSED">{t("passed")}</option>
          <option value="FAILED">{t("failed")}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="score">{t("scoreOpt")}</Label>
        <Input id="score" name="score" type="number" min={0} max={100} step="0.01" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="newLevel">{t("newLevelOpt")}</Label>
        <select
          id="newLevel"
          name="newLevel"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">{t("autoPlaceholder")}</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>
      {error && <p className="md:col-span-5 text-sm text-destructive">{error}</p>}
      <div className="md:col-span-5">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : t("record")}
        </Button>
      </div>
    </form>
  );
}
