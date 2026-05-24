"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logSubscriptionPaymentAction } from "@/app/actions/payments";

export function LogPaymentInline({
  subscriptionId,
  payerUserId,
  defaultAmount,
  traineeName,
  traineePhone,
  groupName,
  locationName,
}: {
  subscriptionId: string;
  payerUserId: string;
  defaultAmount: number;
  traineeName: string;
  traineePhone?: string | null;
  groupName: string;
  locationName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const printReceipt = () => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) return;
    const html = `
      <html>
        <head>
          <title>CSK Academy Receipt - ${receipt}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #111; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #D4AF37; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 26px; font-weight: 800; color: #000; letter-spacing: -0.5px; }
            .csk { color: #D4AF37; }
            .title { font-size: 16px; margin-top: 8px; font-weight: 600; text-transform: uppercase; color: #555; }
            .success { color: #16a34a; font-weight: bold; margin-top: 10px; font-size: 14px; letter-spacing: 0.5px; }
            .details { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details td { padding: 12px 8px; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
            .details td.label { font-weight: bold; color: #4b5563; width: 40%; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">⚔ CSK <span class="csk">ACADEMY</span></div>
            <div class="title">Official Payment Receipt</div>
            <div class="success">✓ PAYMENT SUCCESSFUL</div>
          </div>
          <table class="details">
            <tr>
              <td class="label">Receipt Number:</td>
              <td><code>${receipt}</code></td>
            </tr>
            <tr>
              <td class="label">Trainee Name:</td>
              <td>${traineeName}</td>
            </tr>
            ${
              traineePhone
                ? `<tr>
              <td class="label">Phone Number:</td>
              <td>${traineePhone}</td>
            </tr>`
                : ""
            }
            <tr>
              <td class="label">Training Group:</td>
              <td>${groupName}</td>
            </tr>
            <tr>
              <td class="label">Location:</td>
              <td>${locationName}</td>
            </tr>
            <tr>
              <td class="label">Amount Paid:</td>
              <td><strong>${defaultAmount.toFixed(2)} EGP</strong></td>
            </tr>
            <tr>
              <td class="label">Payment Status:</td>
              <td style="color: #16a34a; font-weight: 600;">PAID IN FULL</td>
            </tr>
            <tr>
              <td class="label">Date:</td>
              <td>${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <div class="footer">
            Thank you for training with CSK Academy!<br>
            Cap. Saied Ibrahim &copy; ${new Date().getFullYear()}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const shareOnWhatsApp = () => {
    const shareMessage = `Hello ${traineeName}, your payment of ${defaultAmount.toFixed(
      2,
    )} EGP for ${groupName} at ${locationName} has been successfully received. Receipt Number: ${receipt}. Thank you for training with CSK Academy! ⚔`;
    let cleanPhone = traineePhone ? traineePhone.replace(/[^\d]/g, "") : "";
    if (cleanPhone.startsWith("01")) {
      cleanPhone = "2" + cleanPhone;
    }
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
      shareMessage,
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  if (receipt) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded-lg bg-card text-left max-w-sm ml-auto">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
          <span className="text-emerald-500">✓</span> Paid Successfully!
        </div>
        <div className="text-xs space-y-1">
          <div>
            <span className="text-muted-foreground">Receipt:</span>{" "}
            <code className="rounded bg-muted px-1 py-0.5">{receipt}</code>
          </div>
          <div>
            <span className="text-muted-foreground">Trainee:</span> {traineeName}
          </div>
          <div>
            <span className="text-muted-foreground">Group:</span> {groupName}
          </div>
          <div>
            <span className="text-muted-foreground">Amount:</span> {defaultAmount.toFixed(2)} EGP
          </div>
        </div>
        <div className="flex gap-1.5 mt-1">
          <Button size="xs" variant="outline" onClick={printReceipt} className="text-[10px] h-7 px-2">
            Download / Print
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={shareOnWhatsApp}
            className="text-[10px] h-7 px-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
          >
            Share WhatsApp
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setReceipt(null)}
            className="text-[10px] h-7 px-2 ml-auto"
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} className="text-csk-gold hover:text-csk-goldLight">
        Log payment
      </Button>
    );
  }

  return (
    <form
      className="flex items-center gap-2 justify-end"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("subscriptionId", subscriptionId);
        fd.set("payerUserId", payerUserId);
        startTransition(async () => {
          setError(null);
          const result = await logSubscriptionPaymentAction(fd);
          if (result.error) setError(result.error);
          else if (result.receiptNumber) {
            setReceipt(result.receiptNumber);
            router.refresh();
          }
        });
      }}
    >
      <Input
        name="amountGross"
        type="number"
        step="0.01"
        min={0.01}
        defaultValue={defaultAmount}
        required
        className="h-9 w-24 text-xs"
        aria-label="Amount"
      />
      <select
        name="method"
        defaultValue="CASH"
        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
        aria-label="Method"
      >
        <option value="CASH">Cash</option>
        <option value="VODAFONE_CASH">Vodafone Cash</option>
        <option value="BANK_TRANSFER">Bank transfer</option>
      </select>
      <Button size="sm" type="submit" disabled={pending} className="bg-csk-gold text-csk-black hover:bg-csk-goldLight h-9">
        {pending ? "..." : "Log"}
      </Button>
      <Button size="sm" type="button" variant="ghost" onClick={() => setOpen(false)} className="h-9">
        Cancel
      </Button>
      {error && <span className="text-xs text-destructive block mt-1">{error}</span>}
    </form>
  );
}
