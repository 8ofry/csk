"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitContactAction } from "@/app/actions/contact";

export function ContactForm() {
  const t = useTranslations("publicSite.contact");
  const tForm = useTranslations("publicSite.contact.form");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (submitted) {
    return (
      <div className="rounded-md border border-csk-gold/40 bg-csk-gold/10 p-6 text-center">
        <p className="font-semibold">{t("submitted")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("submittedSub")}</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError(null);
          const r = await submitContactAction(fd);
          if (r.error) setError(r.error);
          else setSubmitted(true);
        });
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="name">{tForm("name")}</Label>
          <Input id="name" name="name" required minLength={2} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="email">{tForm("email")}</Label>
          <Input id="email" name="email" type="email" required className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="phone">{tForm("phoneOptional")}</Label>
          <Input id="phone" name="phone" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="subject">{tForm("subjectOptional")}</Label>
          <Input id="subject" name="subject" className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="message">{tForm("message")}</Label>
        <Textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={6}
          className="mt-1"
          placeholder={tForm("messagePlaceholder")}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? tForm("sending") : tForm("send")}
      </Button>
    </form>
  );
}
