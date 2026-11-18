import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/db/prisma";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      recipient: { select: { fullNameEn: true, fullNameAr: true } },
      group: { select: { name: true, discipline: { select: { nameEn: true } } } },
      issuedBy: { select: { fullNameEn: true } },
    },
  });

  if (!cert) notFound();

  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-xl border-2 border-csk-gold/50 bg-card p-8 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-sm font-bold uppercase tracking-wider">
            Verified CSK Academy Certificate
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{cert.recipient.fullNameEn}</h1>
          <p className="text-sm text-muted-foreground" dir="rtl">
            {cert.recipient.fullNameAr}
          </p>
        </div>

        <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Award Type</span>
            <Badge variant="outline">{cert.awardType}</Badge>
          </div>
          {cert.group && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Program</span>
              <span className="font-medium">
                {cert.group.name} ({cert.group.discipline.nameEn})
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issued On</span>
            <span>{cert.issuedAt.toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Authorized By</span>
            <span>{cert.issuedBy.fullNameEn}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Certificate ID</span>
            <code className="text-xs font-mono">{cert.id}</code>
          </div>
        </div>

        {cert.narrative && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{cert.narrative}&rdquo;</p>
        )}
      </div>
    </div>
  );
}
