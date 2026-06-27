"use client";

import { useState, useTransition } from "react";
import { toggleProfilePublicAction } from "@/app/actions/championships";

export function TogglePublicProfile({
  registrationId,
  initialIsPublic,
  locale,
}: {
  registrationId: string;
  initialIsPublic: boolean;
  locale: string;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextVal = !isPublic;
    setIsPublic(nextVal);
    startTransition(async () => {
      const res = await toggleProfilePublicAction(registrationId, nextVal);
      if (res.error) {
        // Revert on error
        setIsPublic(!nextVal);
        alert(res.error);
      }
    });
  };

  const isRtl = locale === "ar";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-bold transition-all ${
        isPublic
          ? "bg-csk-gold/10 text-csk-gold border border-csk-gold/30 hover:bg-csk-gold/20"
          : "bg-neutral-800 text-neutral-400 border border-neutral-700 hover:bg-neutral-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isPublic ? "bg-csk-gold animate-pulse" : "bg-neutral-500"}`} />
      {isPublic
        ? isRtl
          ? "عام (معروض بالموقع)"
          : "Public (Visible on site)"
        : isRtl
        ? "خاص (مخفي)"
        : "Private (Hidden)"}
    </button>
  );
}
