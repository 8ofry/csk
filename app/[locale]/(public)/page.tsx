import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import {
  ChevronRight, Trophy, Users, Star, ArrowRight,
  Activity, Shield, MapPin, Phone, Mail, CheckCircle,
} from "lucide-react";
import { listPublicLocations, publicPricing } from "@/application/public/service";
import { AnimatedSection, AnimatedItem } from "@/components/public/animated-section";
import { GoldParticles } from "@/components/public/gold-particles";
import { AmbientGlow } from "@/components/public/ambient-glow";

const COACHES = [
  {
    id: "seed-user-admin",
    nameEn: "Cap. Saied Ibrahim",
    nameAr: "كابتن سعيد ابراهيم",
    role: "Head Coach",
    roleAr: "المدرب الرئيسي",
    photo: "/images/Saied Ibrahim.jpeg",
  },
  {
    id: "seed-user-head-coach",
    nameEn: "Cap. Mariam Amr",
    nameAr: "كابتن مريم عمرو",
    role: "Managing Coach",
    roleAr: "مدربة إدارية",
    photo: "/images/Maryem Amr.jpeg",
  },
  {
    id: "seed-user-coach",
    nameEn: "Cap. Ahmed Khallaf",
    nameAr: "كابتن أحمد خلاف",
    role: "Coach",
    roleAr: "مدرب",
    photo: "/images/Ahmed Khallaf.jpeg",
  },
  {
    id: "seed-user-coach-tarek",
    nameEn: "Cap. Nada",
    nameAr: "كابتن ندى",
    role: "Coach",
    roleAr: "مدربة",
    photo: "/images/Nada.jpeg",
  },
];

const DISCIPLINES = [
  { name: "Boxing", nameAr: "الملاكمة", icon: Trophy, desc: "Master the sweet science" },
  { name: "Kickboxing", nameAr: "الكيك بوكسينغ", icon: Activity, desc: "Stand-up striking art" },
  { name: "MMA", nameAr: "فنون قتالية مختلطة", icon: Shield, desc: "Complete combat system" },
  { name: "Karate", nameAr: "الكاراتيه", icon: Star, desc: "Discipline & precision" },
  { name: "Fitness", nameAr: "اللياقة البدنية", icon: Users, desc: "Warrior conditioning" },
];

const STATS = [
  { value: "5+", label: "Locations" },
  { value: "200+", label: "Athletes" },
  { value: "50+", label: "Championships" },
  { value: "10+", label: "Years Legacy" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [locations, pricing] = await Promise.all([
    listPublicLocations(),
    publicPricing(),
  ]);

  return (
    <div className="bg-[#050505] text-white selection:bg-csk-gold/30 overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.png"
            alt="CSK Academy Gym"
            fill
            className="object-cover object-center opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/50 to-[#050505]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
          {/* Gold radial glow center */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,_rgba(212,175,55,0.12)_0%,_transparent_70%)]" />
        </div>

        {/* Ambient Glow & Gold Particles */}
        <AmbientGlow />
        <GoldParticles />

        <div className="container relative z-10 mx-auto px-4 text-center">
          <AnimatedItem>
            <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-csk-gold/30 bg-csk-gold/10 px-6 py-2 text-xs font-bold tracking-widest text-csk-gold backdrop-blur-md uppercase">
              <Star className="h-3 w-3 fill-csk-gold" />
              <span>CSK Academy — Benha, Egypt</span>
              <Star className="h-3 w-3 fill-csk-gold" />
            </div>
          </AnimatedItem>

          <AnimatedItem delay={0.1}>
            <h1 className="mb-6 text-5xl font-black uppercase tracking-tighter sm:text-7xl md:text-8xl leading-[0.9]">
              <span className="block text-white drop-shadow-2xl">Unleash Your</span>
              <span className="shimmer-text block">Inner Champion</span>
            </h1>
          </AnimatedItem>

          <AnimatedItem delay={0.2}>
            <p className="mx-auto mb-12 max-w-2xl text-lg font-light text-white/60 sm:text-xl leading-relaxed">
              Elite combat sports training under world-class coaches. Boxing, Kickboxing, MMA, Karate & Fitness — all in one academy.
            </p>
          </AnimatedItem>

          <AnimatedItem delay={0.3}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                aria-label="Join CSK"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-csk-gold px-12 py-5 text-base font-black uppercase tracking-wider text-csk-black transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_80px_-15px_rgba(212,175,55,0.8)]"
              >
                {/* Sweeping gradient behind text */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-2">
                  Start Training
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <a
                href="#disciplines"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-10 py-4 text-base font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:border-csk-gold/50 hover:text-csk-gold"
              >
                Explore Disciplines
              </a>
            </div>
          </AnimatedItem>

          {/* Stats bar */}
          <AnimatedItem delay={0.5}>
            <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-px rounded-2xl border border-white/10 bg-white/10 overflow-hidden sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#050505] px-6 py-5 text-center">
                  <div className="text-3xl font-black text-csk-gold">{s.value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/40">{s.label}</div>
                </div>
              ))}
            </div>
          </AnimatedItem>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/20 flex items-start justify-center pt-2">
            <div className="h-2 w-1 rounded-full bg-csk-gold animate-pulse-gold" />
          </div>
        </div>
      </section>

      {/* ── DISCIPLINES ── */}
      <AnimatedSection
        id="disciplines"
        className="py-28 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.05)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">What We Teach</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
              Our <span className="text-gradient-gold">Disciplines</span>
            </h2>
            <div className="section-divider" />
            <p className="mx-auto max-w-xl text-base text-white/50">
              Five elite combat arts. One academy. Choose your path to greatness.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {DISCIPLINES.map((d, i) => (
              <AnimatedItem key={d.name} delay={i * 0.08}>
                <div className="glass-card spotlight-glow group flex cursor-pointer flex-col items-center justify-center gap-5 p-8 text-center h-full hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.15)]">
                  <div className="rounded-2xl bg-white/5 p-5 transition-all duration-500 group-hover:bg-csk-gold group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                    <d.icon className="h-9 w-9 transition-colors duration-500 group-hover:text-csk-black" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase tracking-wider text-white group-hover:text-csk-gold transition-colors duration-300">{d.name}</h3>
                    <p className="text-xs text-white/40 mt-1">{d.nameAr}</p>
                    <p className="mt-2 text-xs text-white/50">{d.desc}</p>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── ABOUT / CHAMPION FEATURE ── */}
      <AnimatedSection
        id="about"
        className="py-28 bg-[#080808] relative overflow-hidden"
      >
        <div className="absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-csk-gold/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-csk-gold/5 blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <AnimatedItem>
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/5 shadow-2xl animate-float spotlight-glow">
                <Image
                  src="/images/champion.png"
                  alt="CSK Champion"
                  fill
                  className="object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="mb-3 inline-block rounded-full bg-csk-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-csk-black">
                    Hall of Fame
                  </div>
                  <h3 className="text-2xl font-black uppercase text-white">Meet Our Champions</h3>
                </div>
                {/* Gold shimmer border */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-csk-gold/20" />
              </div>
            </AnimatedItem>

            <AnimatedItem delay={0.2}>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">About CSK Academy</p>
              <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter md:text-5xl">
                Train With <br />
                <span className="text-gradient-gold">The Best</span>
              </h2>
              <p className="mb-8 text-lg text-white/50 leading-relaxed">
                At CSK Academy, we don&apos;t just teach techniques — we forge champions. Founded by Captain Saied Ibrahim, our academy is home to national titleholders and professional fighters who push the limits of human potential every single day.
              </p>

              <div className="space-y-5">
                {[
                  { icon: Trophy, title: "Proven Methodology", body: "Our structured curriculum is designed to take athletes from beginner to professional competitor." },
                  { icon: Users, title: "Elite Coaching Team", body: "Learn from Captain Saied Ibrahim and our seasoned combat sports veterans, each a champion in their discipline." },
                  { icon: Shield, title: "Competitive Track Record", body: "Dozens of titles across Egyptian and international championships in Boxing, MMA, and Karate." },
                ].map((feat) => (
                  <div key={feat.title} className="flex items-start gap-4">
                    <div className="mt-1 shrink-0 rounded-xl bg-csk-gold/10 p-3">
                      <feat.icon className="h-5 w-5 text-csk-gold" />
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-wider text-white">{feat.title}</h4>
                      <p className="mt-1 text-sm text-white/40">{feat.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <a
                  href="#coaches"
                  className="group inline-flex items-center gap-2 font-bold uppercase tracking-wider text-csk-gold transition-colors hover:text-csk-goldLight"
                >
                  Meet the Coaching Team
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                </a>
              </div>
            </AnimatedItem>
          </div>
        </div>
      </AnimatedSection>

      {/* ── COACHES ── */}
      <AnimatedSection
        id="coaches"
        className="py-28 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(212,175,55,0.05)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">Your Coaches</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
              The <span className="text-gradient-gold">Coaching Team</span>
            </h2>
            <div className="section-divider" />
            <p className="mx-auto max-w-xl text-base text-white/50">
              World-class fighters and educators dedicated to bringing out the champion in you.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COACHES.map((coach, i) => (
              <AnimatedItem key={coach.id} delay={i * 0.1}>
                <div className="glass-card spotlight-glow group overflow-hidden hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.15)]">
                  {/* Photo area */}
                  <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-white/5 to-white/0">
                    <Image
                      src={coach.photo}
                      alt={coach.nameEn}
                      fill
                      className="object-cover object-top transition-transform duration-1000 group-hover:scale-110"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Gold shimmer on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-csk-gold/30 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                  </div>
                  {/* Info */}
                  <div className="p-6 relative z-10 bg-[#050505]/80 backdrop-blur-md">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-csk-gold group-hover:text-csk-goldLight transition-colors">
                      {locale === "ar" ? coach.roleAr : coach.role}
                    </div>
                    <h3 className="text-xl font-black uppercase text-white leading-tight">
                      {locale === "ar" ? coach.nameAr : coach.nameEn}
                    </h3>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>

        </div>
      </AnimatedSection>

      {/* ── LOCATIONS ── */}
      <AnimatedSection
        id="locations"
        className="py-28 bg-[#080808] relative"
      >
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">Where We Train</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
              Our <span className="text-gradient-gold">Locations</span>
            </h2>
            <div className="section-divider" />
            <p className="mx-auto max-w-xl text-base text-white/50">
              5 premier training venues across Benha, Egypt — each equipped for elite combat sports.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc, i) => (
              <AnimatedItem key={loc.id} delay={i * 0.08}>
                <div className="glass-card spotlight-glow group p-8 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.1)]">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-black uppercase tracking-wide text-white group-hover:text-csk-gold transition-colors">{loc.nameEn}</h3>
                      <p className="text-sm text-white/40">{loc.nameAr}</p>
                    </div>
                    {loc.ownership === "CSK_OWNED" && (
                      <span className="shrink-0 rounded-full bg-csk-gold/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-csk-gold border border-csk-gold/30">
                        HQ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <MapPin className="h-4 w-4 text-csk-gold/60" />
                    <span>{loc.district}</span>
                  </div>
                  {loc.contactPhone && (
                    <a
                      href={`tel:${loc.contactPhone}`}
                      className="mt-3 flex items-center gap-2 text-sm text-csk-gold hover:text-csk-goldLight transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      {loc.contactPhone}
                    </a>
                  )}
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ── PRICING ── */}
      <AnimatedSection
        id="pricing"
        className="py-28 relative"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.07)_0%,_transparent_60%)]" />
        <div className="container mx-auto px-4 relative">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">Invest In Yourself</p>
            <h2 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
              Training <span className="text-gradient-gold">Packages</span>
            </h2>
            <div className="section-divider" />
            <p className="mx-auto max-w-xl text-base text-white/50">
              Flexible plans for every level. Contact us for exact pricing tailored to your location and discipline.
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Group Subscription */}
              <AnimatedItem>
                <div className="glass-card p-8 transition-all duration-500 hover:border-csk-gold/50 hover:gold-glow relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-csk-gold/5 blur-2xl" />
                  <div className="mb-2 text-xs font-bold uppercase tracking-widest text-csk-gold">Group Training</div>
                  <h3 className="mb-4 text-2xl font-black uppercase text-white">Monthly Subscription</h3>
                  <ul className="mb-6 space-y-3">
                    {[
                      `${pricing.defaults.sessionsPerMonth} sessions per month`,
                      "Access to certified coaches",
                      "Progress tracking & evaluations",
                      "Belt exam eligibility",
                      "Monthly performance report",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                        <CheckCircle className="h-4 w-4 shrink-0 text-csk-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-csk-gold/50 bg-csk-gold/10 px-6 py-3 text-sm font-bold uppercase tracking-wider text-csk-gold transition-all hover:bg-csk-gold hover:text-csk-black"
                  >
                    Get Pricing <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </AnimatedItem>

              {/* Private sessions */}
              <AnimatedItem delay={0.1}>
                <div className="glass-card spotlight-glow group p-8 relative overflow-hidden border-csk-gold/20 hover:-translate-y-2 hover:shadow-[0_0_60px_-15px_rgba(212,175,55,0.3)]">
                  <div className="absolute -left-8 -bottom-8 h-40 w-40 rounded-full bg-csk-gold/10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
                  <div className="relative z-10">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-csk-gold">1-on-1 Training</div>
                    <h3 className="mb-4 text-2xl font-black uppercase text-white">Private Sessions</h3>
                    <ul className="mb-8 space-y-4">
                      {[
                        "Personal coach attention",
                        "Custom training plan",
                        "Flexible scheduling",
                        "Accelerated progress",
                        "Competition preparation",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-3 text-sm text-white/70">
                          <CheckCircle className="h-5 w-5 shrink-0 text-csk-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/contact"
                      className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-csk-gold px-6 py-4 text-sm font-black uppercase tracking-wider text-csk-black transition-all hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-700 group-hover/btn:translate-x-full" />
                      <span className="relative z-10 flex items-center gap-2">
                        Book a Session <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </span>
                    </Link>
                  </div>
                </div>
              </AnimatedItem>
            </div>

            {/* Disciplines chips */}
            <AnimatedItem delay={0.2}>
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                <p className="mb-4 text-sm text-white/50">Available across all disciplines</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {pricing.disciplines.map((d) => (
                    <span key={d.id} className="rounded-full border border-csk-gold/30 bg-csk-gold/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-csk-gold">
                      {d.nameEn}
                    </span>
                  ))}
                </div>
              </div>
            </AnimatedItem>
          </div>
        </div>
      </AnimatedSection>

      {/* ── CONTACT CTA ── */}
      <AnimatedSection
        id="contact"
        className="py-28 bg-[#080808] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(212,175,55,0.08)_0%,_transparent_70%)]" />
        <div className="container mx-auto px-4 relative text-center">
          <AnimatedItem>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-csk-gold">Ready to Begin?</p>
            <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter sm:text-6xl">
              Join the <span className="text-gradient-gold">CSK Family</span>
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-lg text-white/50 leading-relaxed">
              Your journey to becoming a champion starts with one decision. Reach out to us today and we&apos;ll guide you every step of the way.
            </p>
          </AnimatedItem>

          <AnimatedItem delay={0.2}>
            <div className="mx-auto mb-10 flex max-w-sm flex-col gap-4 sm:flex-row sm:max-w-xl justify-center">
              <a
                href="mailto:captain@csk.local"
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/60 hover:border-csk-gold/40 hover:text-csk-gold transition-all"
              >
                <Mail className="h-4 w-4" /> captain@csk.local
              </a>
              <a
                href="tel:+201000000001"
                className="flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm text-white/60 hover:border-csk-gold/40 hover:text-csk-gold transition-all"
              >
                <Phone className="h-4 w-4" /> +20 100 000 0001
              </a>
            </div>
          </AnimatedItem>

          <AnimatedItem delay={0.3}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                aria-label="Join CSK"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-csk-gold px-14 py-6 text-xl font-black uppercase tracking-wider text-csk-black transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_100px_-15px_rgba(212,175,55,0.8)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                <span className="relative z-10 flex items-center gap-2">
                  Register Now
                  <ChevronRight className="h-7 w-7 transition-transform group-hover:translate-x-2" />
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-10 py-5 text-base font-bold uppercase tracking-wider text-white/70 transition-all hover:border-csk-gold/40 hover:text-csk-gold"
              >
                Member Login
              </Link>
            </div>
          </AnimatedItem>
        </div>
      </AnimatedSection>
    </div>
  );
}
