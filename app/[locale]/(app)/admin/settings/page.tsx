import { requireRole } from "@/lib/auth-guard";
import { featureFlags } from "@/lib/feature-flags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminSettingsPage() {
  await requireRole("ADMIN");

  const storageProvider = process.env.STORAGE_PROVIDER ?? "local";
  const paymentGateway = process.env.PAYMENT_GATEWAY ?? "console";
  const flags = [
    { name: "Online Payments", enabled: featureFlags.onlinePayments() },
    { name: "E-commerce Checkout", enabled: featureFlags.ecommerceCheckout() },
    { name: "Auto Certificates", enabled: featureFlags.autoCertificates() },
    { name: "Native Mobile API", enabled: featureFlags.nativeMobileApi() },
    { name: "Email (Resend)", enabled: Boolean(process.env.RESEND_API_KEY) },
    { name: "WhatsApp (UltraMsg)", enabled: Boolean(process.env.ULTRAMSG_TOKEN) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">Active environment configuration, integrations, and feature flags</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags & Integrations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {flags.map((f) => (
              <div key={f.name} className="flex items-center justify-between border-b py-2 last:border-0">
                <span>{f.name}</span>
                <Badge variant={f.enabled ? "default" : "secondary"}>
                  {f.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drivers & Runtime</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between border-b py-2">
              <span>Storage Provider</span>
              <Badge variant="outline">{storageProvider}</Badge>
            </div>
            <div className="flex items-center justify-between border-b py-2">
              <span>Payment Gateway</span>
              <Badge variant="outline">{paymentGateway}</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>GDPR Personal Data Export</span>
              <a href="/api/v1/me/export" download className="text-csk-gold hover:underline text-xs">
                Download My Export
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
