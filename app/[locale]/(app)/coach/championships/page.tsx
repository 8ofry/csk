import { auth } from "@/auth";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { isAtLeast } from "@/lib/rbac";
import { prisma } from "@/infrastructure/db/prisma";
import { CoachChampionshipsClient } from "@/components/championship/coach-championships-client";
import { listChampionships } from "@/application/championships/service";

export default async function CoachChampionshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session || !session.user || !isAtLeast(session.user.role, "COACH")) {
    redirect({ href: "/", locale });
    return null;
  }

  const coachUserId = session.user.id;

  // 1. Get coach details to retrieve their academy (null means internal CSK coach)
  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: { academy: true, academyId: true },
  });

  const academy = coach?.academy ?? {
    id: "csk-internal",
    nameEn: "CSK Academy",
    nameAr: "أكاديمية CSK",
  };

  // 2. Get list of championships
  const championships = await listChampionships();

  if (championships.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed rounded-lg bg-card text-muted-foreground">
        {locale === "ar" ? "لا توجد بطولات مفتوحة حالياً." : "No championships are currently open."}
      </div>
    );
  }

  const resolvedParams = await searchParams;
  const selectedChampionshipId = resolvedParams.id || championships[0]?.id || "";

  // 3. Get registrations in this academy (or internal CSK trainees) for the selected championship
  const registrations = await prisma.championshipRegistration.findMany({
    where: {
      championshipId: selectedChampionshipId,
      trainee: coach?.academyId
        ? { academyId: coach.academyId }
        : {
            OR: [
              { academyId: null },
              { enrollments: { some: { group: { coaches: { some: { coachId: coachUserId } } } } } },
            ],
          },
    },
    include: {
      trainee: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CoachChampionshipsClient
      championships={championships}
      initialRegistrations={registrations}
      academy={academy}
      selectedId={selectedChampionshipId}
      locale={locale}
    />
  );
}
