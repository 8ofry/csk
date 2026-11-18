import { Link } from "@/i18n/navigation";

export default async function FawryReferencePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; amount?: string; expiresAt?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-csk-gold">Fawry Payment Reference</h1>
        <p className="text-sm text-muted-foreground">
          Use the reference number below at any Fawry kiosk or via the myFawry app to complete your payment.
        </p>
        <div className="rounded-md border border-csk-gold/40 bg-csk-gold/10 p-4 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Reference Code</div>
          <div className="mt-1 font-mono text-2xl font-bold text-csk-gold">
            {sp.ref ?? "PENDING"}
          </div>
          {sp.amount && <div className="mt-2 text-sm">Amount: {sp.amount} EGP</div>}
          {sp.expiresAt && (
            <div className="mt-1 text-xs text-muted-foreground">Expires: {sp.expiresAt}</div>
          )}
        </div>
        <Link
          href="/trainee/payments"
          className="inline-block rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-black hover:bg-csk-gold/90"
        >
          Back to Payments
        </Link>
      </div>
    </div>
  );
}
