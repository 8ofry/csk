import { getTranslations } from "next-intl/server";
import { listCertificatesForUser } from "@/application/certificates/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const KNOWN_AWARDS = new Set([
  "BEST_TRAINEE_GROUP",
  "BEST_TRAINEE_LOCATION",
  "BEST_COACH_LOCATION",
  "BELT_PROGRESSION",
  "CHAMPIONSHIP",
]);

export async function CertificatesTimeline({
  userId,
  emptyMessage,
}: {
  userId: string;
  emptyMessage?: string;
}) {
  const [t, certs] = await Promise.all([
    getTranslations("certificates"),
    listCertificatesForUser(userId),
  ]);
  const fallbackEmpty = emptyMessage ?? t("defaultEmpty");

  if (certs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {fallbackEmpty}
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {certs.map((c) => (
        <Card key={c.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">
                  <span className="me-2 text-csk-gold">★</span>
                  {KNOWN_AWARDS.has(c.awardType)
                    ? t(`awards.${c.awardType}` as `awards.${"BEST_TRAINEE_GROUP" | "BEST_TRAINEE_LOCATION" | "BEST_COACH_LOCATION" | "BELT_PROGRESSION" | "CHAMPIONSHIP"}`)
                    : t("awards.DEFAULT")}
                </CardTitle>
                {c.group?.name && (
                  <p className="text-xs text-muted-foreground">{c.group.name}</p>
                )}
              </div>
              <Badge variant="outline">
                {c.periodYear}-{String(c.periodMonth ?? 0).padStart(2, "0")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{c.narrative}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("issuedBy", { name: c.issuedBy.fullNameEn })}</span>
              <span>{c.issuedAt.toLocaleDateString()}</span>
            </div>
            {c.pdfUrl && (
              <a
                href={c.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-csk-gold hover:underline"
              >
                {t("downloadPdf")}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
    </ul>
  );
}
