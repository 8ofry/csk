"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { logSaleAction } from "@/app/actions/merchandise";

export function LogSaleForm({
  itemId,
  defaultUnitPrice,
  variants,
  locations,
  trainees,
}: {
  itemId: string;
  defaultUnitPrice: number;
  variants: string[];
  locations: { id: string; label: string }[];
  trainees: { id: string; label: string }[];
}) {
  const t = useTranslations("hcLogSale");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [receipt, setReceipt] = useState<{ ref: string; lowStock: boolean } | null>(null);

  return (
    <form
      className="grid grid-cols-1 gap-3 md:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("itemId", itemId);
        startTransition(async () => {
          setError(null);
          const r = await logSaleAction(fd);
          if (r.error) setError(r.error);
          else if (r.receiptNumber) {
            setReceipt({ ref: r.receiptNumber, lowStock: !!r.lowStock });
            (e.currentTarget as HTMLFormElement).reset();
            router.refresh();
          }
        });
      }}
    >
      <div>
        <Label htmlFor="locationId">{t("saleLocation")}</Label>
        <select
          id="locationId"
          name="locationId"
          required
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="customerUserId">{t("customerOpt")}</Label>
        <select
          id="customerUserId"
          name="customerUserId"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">{t("walkIn")}</option>
          {trainees.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="paymentMethod">{t("method")}</Label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          defaultValue="CASH"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="CASH">{t("methods.cash")}</option>
          <option value="VODAFONE_CASH">{t("methods.vodafone")}</option>
          <option value="BANK_TRANSFER">{t("methods.transfer")}</option>
        </select>
      </div>
      <div>
        <Label htmlFor="variantSku">{t("variant")}</Label>
        <select
          id="variantSku"
          name="variantSku"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csk-gold"
        >
          <option value="">—</option>
          {variants.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="quantity">{t("quantity")}</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="unitPrice">{t("unitPrice")}</Label>
        <Input
          id="unitPrice"
          name="unitPrice"
          type="number"
          step="0.01"
          min={0}
          defaultValue={defaultUnitPrice}
          required
          className="mt-1"
        />
      </div>

      {error && <p className="md:col-span-3 text-sm text-destructive">{error}</p>}
      {receipt && (
        <div className="md:col-span-3 flex items-center gap-2 text-sm">
          <Badge variant="success">{t("receipt", { ref: receipt.ref })}</Badge>
          {receipt.lowStock && <Badge variant="warning">{t("lowStockNow")}</Badge>}
        </div>
      )}

      <div className="md:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "..." : t("logSale")}
        </Button>
      </div>
    </form>
  );
}
