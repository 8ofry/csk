import { Link } from "@/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Trophy, Users, Star, ArrowRight, Activity, Shield } from "lucide-react";
import Image from "next/image";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tBrand = await getTranslations("brand");

  return (
    <div className="bg-csk-black text-white selection:bg-csk-gold/30">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.png"
            alt="CSK Academy Gym"
            fill
            className="object-cover object-center opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-csk-black via-csk-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-csk-black via-transparent to-csk-black" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center animate-fade-in-up">
          <div className="mx-auto mb-8 inline-flex items-center rounded-full border border-csk-gold/30 bg-csk-gold/10 px-6 py-2 text-sm font-semibold tracking-widest text-csk-gold backdrop-blur-md uppercase">
            <Star className="mr-2 h-4 w-4 fill-csk-gold" />
            <span>{tBrand("tagline")}</span>
            <Star className="ml-2 h-4 w-4 fill-csk-gold" />
          </div>
          
          <h1 className="mb-6 text-5xl font-black uppercase tracking-tighter sm:text-7xl md:text-8xl lg:text-[8rem] leading-[0.9]">
            <span className="block text-white drop-shadow-2xl">Unleash Your</span>
            <span className="block text-gradient-gold">Inner Champion</span>
          </h1>
          
          <p className="mx-auto mb-12 max-w-2xl text-lg font-medium text-white/80 sm:text-2xl drop-shadow-lg">
            {t("heroSubtitle")}
          </p>
          
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Link
              href="/register"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-csk-gold px-10 py-5 text-lg font-bold uppercase tracking-wider text-csk-black transition-all hover:scale-105 hover:bg-csk-goldLight hover:shadow-[0_0_50px_-10px_rgba(212,175,55,0.7)]"
            >
              <span>{t("ctaJoin")}</span>
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
            </Link>
            
            <Link
              href="/disciplines"
              className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-10 py-5 text-lg font-bold uppercase tracking-wider text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-csk-gold hover:text-csk-gold"
            >
              <span>{t("ctaExplore")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Disciplines Section */}
      <section className="relative z-20 -mt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
            {[
              { name: "Boxing", icon: Trophy },
              { name: "Kickboxing", icon: Activity },
              { name: "MMA", icon: Shield },
              { name: "Karate", icon: Star },
              { name: "Fitness", icon: Users },
            ].map((d, i) => (
              <div
                key={d.name}
                className="glass-card group flex cursor-pointer flex-col items-center justify-center gap-4 p-8 transition-all duration-500 hover:-translate-y-4 hover:border-csk-gold/60 hover:bg-white/10 hover:shadow-[0_20px_40px_-15px_rgba(212,175,55,0.4)] animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="rounded-2xl bg-white/5 p-5 text-white transition-all duration-300 group-hover:bg-csk-gold group-hover:text-csk-black group-hover:scale-110">
                  <d.icon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <span className="text-lg font-bold tracking-widest text-white/80 group-hover:text-csk-gold uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Champion Feature Section */}
      <section className="relative overflow-hidden py-32 bg-[#080808]">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <Image 
                src="/images/champion.png"
                alt="CSK Champion"
                fill
                className="object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-csk-black/90 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="inline-block rounded-full bg-csk-gold px-4 py-1 text-xs font-bold uppercase tracking-wider text-csk-black mb-3">
                  Hall of Fame
                </div>
                <h3 className="text-3xl font-black uppercase text-white">Meet Our Champions</h3>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
              <h2 className="mb-6 text-4xl font-black uppercase tracking-tighter md:text-6xl text-white">
                Train With <br/> <span className="text-gradient-gold">The Best</span>
              </h2>
              <p className="mb-8 text-xl font-light text-white/60 leading-relaxed">
                At Team Cap Saied, we don't just teach techniques; we forge champions. Our facility is home to national titleholders and professional fighters who push the limits of human potential every single day.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-csk-gold/10 p-3 mt-1">
                    <Trophy className="h-6 w-6 text-csk-gold" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wider">Proven Methodology</h4>
                    <p className="text-white/50">Our structured curriculum is designed to take you from beginner to professional competitor.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-csk-gold/10 p-3 mt-1">
                    <Users className="h-6 w-6 text-csk-gold" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white uppercase tracking-wider">Elite Coaching</h4>
                    <p className="text-white/50">Learn directly from Captain Saied and a team of seasoned combat sports veterans.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-12">
                <Link href="/coaches" className="group inline-flex items-center font-bold text-csk-gold uppercase tracking-wider hover:text-csk-goldLight transition-colors text-lg">
                  Meet the Coaching Team 
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
