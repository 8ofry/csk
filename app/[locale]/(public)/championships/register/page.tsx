import { prisma } from "@/infrastructure/db/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { IndividualRegisterForm } from "./register-form";

export default async function IndividualRegisterPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ id?: string }>;
  params: Promise<{ locale: string }>;
}) {
  const { id } = await searchParams;
  const { locale } = await params;
  const isRtl = locale === "ar";

  if (!id) {
    notFound();
  }

  const championship = await prisma.championship.findUnique({
    where: { id },
  });

  if (!championship) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-csk-gold/5 blur-[150px]" />

      <div className="container max-w-2xl px-4 relative z-10">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/championships"
            className="text-sm font-semibold text-csk-gold hover:text-csk-goldLight transition-colors"
          >
            {isRtl ? "← العودة للبطولات" : "← Back to Championships"}
          </Link>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-neutral-900 bg-neutral-900/40 p-6 md:p-10 shadow-2xl backdrop-blur-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-csk-gold uppercase tracking-tight">
              {isRtl ? "تسجيل مقاتل فردي" : "Individual Fighter Entry"}
            </h1>
            <p className="text-neutral-400 text-sm">
              {isRtl
                ? `يرجى إدخال بياناتك للتسجيل في بطولة: ${championship.name}`
                : `Enter your details to register for: ${championship.name}`}
            </p>
          </div>

          <IndividualRegisterForm
            championshipId={championship.id}
            championshipName={championship.name}
            registrationFee={Number(championship.registrationFee)}
            locale={locale}
          />
        </div>
      </div>
    </div>
  );
}
