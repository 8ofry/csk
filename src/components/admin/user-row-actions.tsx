"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  approveUserAction,
  promoteInternAction,
  reactivateUserAction,
  suspendUserAction,
} from "@/app/actions/users";

export function UserRowActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: string;
  status: string;
}) {
  const t = useTranslations("adminUserActions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok?: true; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status === "PENDING" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => approveUserAction(userId))}
        >
          {t("approve")}
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(t("suspendConfirm"))) return;
            run(() => suspendUserAction(userId));
          }}
        >
          {t("suspend")}
        </Button>
      )}
      {status === "SUSPENDED" && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => reactivateUserAction(userId))}
        >
          {t("reactivate")}
        </Button>
      )}
      {role === "INTERN" && status === "ACTIVE" && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(t("promoteConfirm"))) return;
            run(() => promoteInternAction(userId));
          }}
        >
          {t("promote")}
        </Button>
      )}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
