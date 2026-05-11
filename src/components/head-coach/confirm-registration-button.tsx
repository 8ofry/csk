"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { confirmRegistrationAction } from "@/app/actions/championships";

export function ConfirmRegistrationButton({ registrationId }: { registrationId: string }) {
  const t = useTranslations("hcConfirmRegistration");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const r = await confirmRegistrationAction(registrationId);
            if (r.error) setError(r.error);
            else router.refresh();
          })
        }
      >
        {pending ? "..." : t("label")}
      </Button>
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </>
  );
}
