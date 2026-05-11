"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { issueCertificateAction } from "@/app/actions/certificates";

export function IssueCertificateButton({
  recipientId,
  awardType,
  groupId,
  year,
  month,
  suggestedNarrative,
}: {
  recipientId: string;
  awardType: string;
  groupId: string | null;
  year: number;
  month: number;
  suggestedNarrative: string;
}) {
  const t = useTranslations("hcIssueCert");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [narrative, setNarrative] = useState(suggestedNarrative);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [issued, setIssued] = useState(false);

  if (issued) {
    return <span className="text-xs text-csk-gold">{t("issued")}</span>;
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("issue")}
      </Button>
    );
  }

  return (
    <form
      className="space-y-2 rounded-md border bg-card p-3 text-start"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.set("recipientId", recipientId);
        fd.set("awardType", awardType);
        if (groupId) fd.set("groupId", groupId);
        fd.set("periodYear", String(year));
        fd.set("periodMonth", String(month));
        fd.set("narrative", narrative);
        startTransition(async () => {
          setError(null);
          const r = await issueCertificateAction(fd);
          if (r.error) setError(r.error);
          else {
            setIssued(true);
            setOpen(false);
            router.refresh();
          }
        });
      }}
    >
      <Textarea
        value={narrative}
        onChange={(e) => setNarrative(e.target.value)}
        rows={3}
        required
        minLength={3}
        className="text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "..." : t("confirm")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
