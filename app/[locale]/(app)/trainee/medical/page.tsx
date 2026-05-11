import { getTranslations } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { getTraineeMedical, isTraineeCleared } from "@/application/medical/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MedicalRecordForm } from "@/components/medical/medical-record-form";
import { MedicalDocumentUpload } from "@/components/medical/medical-document-upload";
import { addMedicalDocumentAction, saveMedicalRecordAction } from "@/app/actions/medical";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { daysUntilExpiry } from "@/domain/medical/clearance";

export default async function TraineeMedicalPage() {
  const user = await requireRole("TRAINEE");
  const [t, tCommon, { record, documents }, cleared] = await Promise.all([
    getTranslations("trainee.medical"),
    getTranslations("common"),
    getTraineeMedical(user.id),
    isTraineeCleared(user.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("eligibility")}{" "}
            {cleared ? (
              <Badge variant="success">{t("cleared")}</Badge>
            ) : (
              <Badge variant="destructive">{t("notCleared")}</Badge>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("recordTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicalRecordForm
            traineeId={user.id}
            defaultValues={record ?? undefined}
            onSubmit={saveMedicalRecordAction}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("documentsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MedicalDocumentUpload traineeId={user.id} onSubmit={addMedicalDocumentAction} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("documentTable.type")}</TableHead>
                <TableHead>{t("documentTable.issueDate")}</TableHead>
                <TableHead>{t("documentTable.expiry")}</TableHead>
                <TableHead>{t("documentTable.doctor")}</TableHead>
                <TableHead>{t("documentTable.status")}</TableHead>
                <TableHead>{t("documentTable.file")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((d) => {
                const days = daysUntilExpiry(d.expiryDate);
                return (
                  <TableRow key={d.id}>
                    <TableCell>{d.documentType}</TableCell>
                    <TableCell>{d.issueDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {d.expiryDate.toLocaleDateString()}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({days < 0 ? tCommon("expired") : `${days} ${tCommon("today")}`})
                      </span>
                    </TableCell>
                    <TableCell>{d.issuingDoctor ?? "—"}</TableCell>
                    <TableCell>
                      {d.status === "ACTIVE" && days >= 0 ? (
                        days <= 30 ? (
                          <Badge variant="warning">{tCommon("expiring")}</Badge>
                        ) : (
                          <Badge variant="success">{tCommon("active")}</Badge>
                        )
                      ) : (
                        <Badge variant="destructive">{tCommon("expired")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-csk-gold hover:underline"
                      >
                        {tCommon("open")}
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("uploadEmpty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
