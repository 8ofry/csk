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

  // 1. Get coach details to retrieve their academy
  const coach = await prisma.user.findUnique({
    where: { id: coachUserId },
    select: { academy: true, academyId: true },
  });

  if (!coach || !coach.academyId || !coach.academy) {
    return (
      <div className="p-6 text-center border border-dashed rounded-lg bg-card text-muted-foreground">
        {locale === "ar"
          ? "لم يتم العثور على الأكاديمية المرتبطة بهذا المدرب. يرجى التواصل مع مسؤول النظام."
          : "Associated Academy not found. Please contact the administrator."}
      </div>
    );
  }

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

  // 3. Get registrations in this academy for the selected championship
  const registrations = await prisma.championshipRegistration.findMany({
    where: {
      championshipId: selectedChampionshipId,
      trainee: {
        academyId: coach.academyId,
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
      academy={coach.academy}
      selectedId={selectedChampionshipId}
      locale={locale}
    />
  );
}
