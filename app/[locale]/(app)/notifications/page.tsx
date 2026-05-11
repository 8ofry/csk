import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import {
  getPreferences,
  listInbox,
  unreadCount,
} from "@/application/notifications/inbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { PreferencesForm } from "@/components/notifications/preferences-form";

export default async function NotificationsPage() {
  const session = await auth();
  const locale = await getLocale();
  if (!session?.user) redirect({ href: "/login", locale });

  const [t, items, unread, prefs] = await Promise.all([
    getTranslations("notifications"),
    listInbox(session!.user.id),
    unreadCount(session!.user.id),
    getPreferences(session!.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {t("title")}{" "}
            {unread > 0 && <Badge variant="destructive">{t("newSuffix", { count: unread })}</Badge>}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {unread > 0 && <MarkAllReadButton />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("inboxTitle", { count: items.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y">
              {items.map((n) => {
                const payload = n.payload as { _rendered?: { subject?: string; body?: string } } | null;
                const subject = payload?._rendered?.subject ?? n.eventType;
                const body = payload?._rendered?.body ?? "";
                return (
                  <li key={n.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{subject}</div>
                        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {n.createdAt.toLocaleString()}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("preferencesTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm defaultOptedOut={prefs.optedOut} />
        </CardContent>
      </Card>
    </div>
  );
}
