import { getLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/infrastructure/db/prisma";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { QuickAddTraineeForm } from "@/components/head-coach/quick-add-trainee-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function TraineesPage() {
  await requireRole("HEAD_COACH");
  const [locale, trainees] = await Promise.all([
    getLocale(),
    prisma.user.findMany({
      where: { role: "TRAINEE" },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        fullNameEn: true,
        fullNameAr: true,
        phone: true,
        email: true,
        status: true,
        createdAt: true,
        enrollments: {
          where: { status: "ACTIVE" },
          select: { group: { select: { name: true } } },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trainees</h1>
          <p className="text-muted-foreground">
            Manage trainee accounts and group enrollments.
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold">Quick Add Trainee</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Create a trainee account using their phone number. They can set up their email and password later.
        </p>
        <QuickAddTraineeForm />
      </div>

      {/* Trainees List */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          All Trainees{" "}
          <span className="text-sm font-normal text-muted-foreground">({trainees.length})</span>
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Groups</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  No trainees yet. Use the form above to add the first one.
                </TableCell>
              </TableRow>
            )}
            {trainees.map((tr) => {
              const isPlaceholderEmail = tr.email.endsWith("@phone.csk.local");
              return (
                <TableRow key={tr.id}>
                  <TableCell>
                    <div className="font-medium">{locale === "ar" ? tr.fullNameAr : tr.fullNameEn}</div>
                    <div className="text-xs text-muted-foreground">
                      {locale === "ar" ? tr.fullNameEn : tr.fullNameAr}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{tr.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {isPlaceholderEmail ? (
                      <span className="italic text-muted-foreground">Phone-only account</span>
                    ) : (
                      tr.email
                    )}
                  </TableCell>
                  <TableCell>
                    {tr.enrollments.length === 0 ? (
                      <span className="text-muted-foreground text-sm">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {tr.enrollments.map((e, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {e.group.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tr.status === "ACTIVE"
                          ? "success"
                          : tr.status === "PENDING"
                          ? "warning"
                          : "secondary"
                      }
                    >
                      {tr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tr.createdAt.toLocaleDateString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-lg border border-csk-gold/20 bg-csk-gold/5 p-4 text-sm">
        <p className="font-medium text-csk-gold">📌 How to enroll a trainee in a group:</p>
        <p className="mt-1 text-muted-foreground">
          Go to{" "}
          <Link href="/head-coach/groups" className="underline hover:text-csk-gold">
            Groups
          </Link>{" "}
          → click <strong>Manage</strong> on any group → scroll down to the{" "}
          <strong>Roster</strong> section → select the trainee from the dropdown and click{" "}
          <strong>Enroll</strong>.
        </p>
      </div>
    </div>
  );
}
