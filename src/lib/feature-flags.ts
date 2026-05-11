// Feature flag helpers (NFR-MNT-03). v2 features stay OFF in v1 by default;
// flip the env var to expose them. v2 will graduate these to a typed flag
// service (LaunchDarkly / GrowthBook / Unleash) — interface stays the same.

const TRUTHY = new Set(["1", "true", "on", "yes"]);

function isOn(envValue: string | undefined): boolean {
  return TRUTHY.has((envValue ?? "").toLowerCase());
}

export const featureFlags = {
  onlinePayments: () => isOn(process.env.FEATURE_ONLINE_PAYMENTS),
  ecommerceCheckout: () => isOn(process.env.FEATURE_ECOMMERCE_CHECKOUT),
  autoCertificates: () => isOn(process.env.FEATURE_AUTO_CERTIFICATES),
  nativeMobileApi: () => isOn(process.env.FEATURE_NATIVE_MOBILE_API),
} as const;
