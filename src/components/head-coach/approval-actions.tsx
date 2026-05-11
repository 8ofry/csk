"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { approvePlanAction, rejectPlanAction } from "@/app/actions/session-plans";

export interface ApprovalActionsLabels {
  approve: string;
  reject: string;
  cancelReject: string;
  confirmReject: string;
  rejectPlaceholder: string;
  shortCommentError: string;
}

export function ApprovalActions({
  planId,
  labels,
}: {
  planId: string;
  labels: ApprovalActionsLabels;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);

  const approve = () => {
    startTransition(async () => {
      setError(null);
      const result = await approvePlanAction(planId);
      if (result.error) setError(result.error);
      else router.push("/head-coach/approvals");
    });
  };

  const reject = () => {
    if (comment.trim().length < 3) {
      setError(labels.shortCommentError);
      return;
    }
    startTransition(async () => {
      setError(null);
      const result = await rejectPlanAction(planId, comment);
      if (result.error) setError(result.error);
      else router.push("/head-coach/approvals");
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={approve} disabled={pending}>
          {labels.approve}
        </Button>
        <Button variant="outline" onClick={() => setShowReject((s) => !s)}>
          {showReject ? labels.cancelReject : labels.reject}
        </Button>
      </div>
      {showReject && (
        <div className="space-y-2 rounded-md border p-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={labels.rejectPlaceholder}
            rows={3}
          />
          <Button variant="destructive" onClick={reject} disabled={pending}>
            {labels.confirmReject}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
