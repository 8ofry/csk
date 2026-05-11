"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { savePreferencesAction } from "@/app/actions/notifications";

const CHANNELS = [
  { key: "WHATSAPP", labelKey: "whatsapp" as const },
  { key: "EMAIL", labelKey: "email" as const },
] as const;

export function PreferencesForm({ defaultOptedOut }: { defaultOptedOut: string[] }) {
  const t = useTranslations("notifications");
  const initial = new Set(defaultOptedOut);
  const [optedOut, setOptedOut] = useState<Set<string>>(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: string) {
    const next = new Set(optedOut);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOptedOut(next);
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData();
        for (const key of optedOut) fd.append("optedOut", key);
        startTransition(async () => {
          setError(null);
          const r = await savePreferencesAction(fd);
          if (r.error) setError(r.error);
          else setSavedAt(new Date());
        });
      }}
    >
      <p className="text-xs text-muted-foreground">{t("preferencesHint")}</p>
      <div className="space-y-2">
        {CHANNELS.map((c) => {
          const channelLabel = t(`channels.${c.labelKey}`);
          return (
            <label key={c.key} className="flex items-center gap-3 rounded-md border p-3">
              <input
                type="checkbox"
                checked={optedOut.has(c.key)}
                onChange={() => toggle(c.key)}
                className="h-4 w-4 accent-csk-gold"
              />
              <div>
                <div className="font-medium">{t("muteLabel", { label: channelLabel })}</div>
                <div className="text-xs text-muted-foreground">
                  {optedOut.has(c.key) ? t("mutedBadge") : t("receivingBadge")}
                </div>
              </div>
            </label>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : t("savePreferences")}
        </Button>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            {t("savedAt", { time: savedAt.toLocaleTimeString() })}
          </span>
        )}
      </div>
    </form>
  );
}
