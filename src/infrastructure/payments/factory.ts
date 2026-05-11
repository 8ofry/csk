// Adapter selection — driven by env. Defaults to a configured provider in the
// preference order: explicit > Paymob > Vodafone Cash > Fawry > console (dev).
// Production refuses to fall back to console.

import type { PaymentAdapter } from "./adapter";
import { ConsolePaymentAdapter } from "./console";
import { PaymobAdapter } from "./paymob";
import { VodafoneCashAdapter } from "./vodafone-cash";
import { FawryAdapter } from "./fawry";

let cached: PaymentAdapter | null = null;

const PROVIDER_FACTORIES: Record<string, () => PaymentAdapter> = {
  paymob: () => new PaymobAdapter(),
  "vodafone-cash": () => new VodafoneCashAdapter(),
  fawry: () => new FawryAdapter(),
  console: () => new ConsolePaymentAdapter(),
};

export function paymentAdapter(): PaymentAdapter {
  if (cached) return cached;

  const provider = (process.env.PAYMENT_PROVIDER ?? "auto").toLowerCase();

  if (provider !== "auto") {
    const make = PROVIDER_FACTORIES[provider];
    if (!make) throw new Error(`Unknown PAYMENT_PROVIDER: ${provider}`);
    cached = make();
    return cached;
  }

  // Auto: pick the first configured production adapter.
  const candidates: PaymentAdapter[] = [
    new PaymobAdapter(),
    new VodafoneCashAdapter(),
    new FawryAdapter(),
  ];
  const configured = candidates.find((a) => a.isConfigured);
  if (configured) {
    cached = configured;
    return cached;
  }

  if (process.env.NODE_ENV !== "production") {
    cached = new ConsolePaymentAdapter();
    return cached;
  }

  throw new Error(
    "No payment adapter configured. Set PAYMENT_PROVIDER + provider keys (Paymob / Vodafone Cash / Fawry).",
  );
}

/**
 * Lookup an adapter by provider name — used by webhook routes that are pinned
 * to a specific provider (e.g. /api/v1/webhooks/paymob always verifies as Paymob).
 */
export function paymentAdapterFor(provider: string): PaymentAdapter {
  const make = PROVIDER_FACTORIES[provider];
  if (!make) throw new Error(`Unknown payment provider: ${provider}`);
  return make();
}

/** Reset the cached adapter — used in tests. */
export function resetPaymentAdapter() {
  cached = null;
}
