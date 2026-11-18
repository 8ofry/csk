import { Link } from "@/i18n/navigation";

export default async function PaymentSimulatePage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; amount?: string; status?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-lg space-y-4">
        <h1 className="text-2xl font-bold text-csk-gold">Payment Sandbox Simulator</h1>
        <p className="text-sm text-muted-foreground">
          Development checkout simulation for payment intent{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{sp.intent ?? "N/A"}</code>.
        </p>
        {sp.amount && (
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            Amount: <span className="font-semibold">{sp.amount} EGP</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          In production, this redirects to the configured payment gateway (Paymob / Fawry / Vodafone Cash).
        </p>
        <div className="flex gap-3 pt-2">
          <Link
            href="/trainee/payments"
            className="rounded-md bg-csk-gold px-4 py-2 text-sm font-semibold text-black hover:bg-csk-gold/90"
          >
            Back to Payments
          </Link>
        </div>
      </div>
    </div>
  );
}
