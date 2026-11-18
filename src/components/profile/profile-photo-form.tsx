"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Camera, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateProfilePhotoAction } from "@/app/actions/profile";

export function ProfilePhotoForm({
  initialPhotoUrl,
  displayName,
}: {
  initialPhotoUrl: string | null;
  displayName: string;
}) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateProfilePhotoAction(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setPhotoUrl(res.photoUrl ?? null);
        setMessage(isAr ? "تم تحديث صورة الملف الشخصي" : "Profile photo updated");
      }
    });
  }

  function handleRemove() {
    setMessage(null);
    setError(null);
    const fd = new FormData();
    fd.set("intent", "remove");
    startTransition(async () => {
      const res = await updateProfilePhotoAction(fd);
      if (res.error) {
        setError(res.error);
      } else {
        setPhotoUrl(null);
        setMessage(isAr ? "تمت إزالة الصورة واستخدام الصورة الافتراضية" : "Reverted to default avatar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-csk-gold/50 bg-csk-gold/10 shadow-sm">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <User className="h-10 w-10 text-csk-gold" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 space-y-3">
        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp"
            required
            className="block max-w-xs text-xs text-muted-foreground file:me-3 file:rounded-lg file:border file:border-csk-gold/40 file:bg-csk-gold/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-csk-gold hover:file:bg-csk-gold/20"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Camera className="me-1.5 h-4 w-4" />
            {pending
              ? isAr ? "جاري الحفظ..." : "Saving..."
              : isAr ? "تحديث الصورة" : "Update photo"}
          </Button>
          {photoUrl && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={handleRemove}
            >
              <Trash2 className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "إزالة" : "Remove"}
            </Button>
          )}
        </form>
        <p className="text-xs text-muted-foreground">
          {isAr
            ? "PNG أو JPG أو WebP بحد أقصى 5 ميجابايت."
            : "PNG, JPG, or WebP up to 5 MB."}
        </p>
        {message && <p className="text-xs font-medium text-emerald-600">{message}</p>}
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    </div>
  );
}
