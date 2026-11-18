import { requireRole } from "@/lib/auth-guard";
import { Link } from "@/i18n/navigation";
import { getFamilyOverview } from "@/application/family/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TraineeFamilyHubPage() {
  const user = await requireRole("TRAINEE");
  const children = await getFamilyOverview(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Family Hub</h1>
        <p className="text-muted-foreground">
          Monitor your linked athletes&apos; attendance, medical clearance, and subscriptions
        </p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No linked child accounts found under your profile. Contact the academy desk to link family members.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {children.map((child) => (
            <Card key={child.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{child.fullNameEn}</CardTitle>
                  <Badge variant={child.medValid ? "default" : "destructive"}>
                    {child.medValid ? "Medical Cleared" : "Medical Due"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground" dir="rtl">
                  {child.fullNameAr}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">30-Day Attendance</span>
                  <span className="font-semibold">{child.monthAttended} sessions</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Active Groups:</span>
                  {child.enrollments.length === 0 ? (
                    <span className="ms-2 text-xs text-muted-foreground">None</span>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {child.enrollments.map((e) => (
                        <li key={e.id} className="text-xs">
                          • {e.group.name} ({e.group.discipline.nameEn} · {e.group.location.nameEn})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {child.latestSubscription && (
                  <div className="flex items-center justify-between border-t pt-2">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Subscription ({child.latestSubscription.billingCycle})
                      </div>
                      <div className="text-xs">
                        Ends {child.latestSubscription.currentPeriodEnd.toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{child.latestSubscription.paymentStatus}</Badge>
                  </div>
                )}
                <div className="pt-1">
                  <Link
                    href="/trainee/payments"
                    className="inline-block rounded-md bg-csk-gold px-3 py-1.5 text-xs font-semibold text-black hover:bg-csk-gold/90"
                  >
                    Manage / Pay Subscription
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
