
import { Star, Phone } from "lucide-react";

export default function HeroSection() {
  return (
    <>
      {/* ==========================================
          HERO SECTION
      ========================================== */}
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#080b13] text-white">

        {/* Background photo */}
        <div
          className="absolute inset-0 -z-30 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/carmart-hero.jpg')" }}
        />

        {/* Horizontal dark gradient */}
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(4,6,13,0.99)_0%,rgba(4,6,13,0.97)_25%,rgba(4,6,13,0.85)_40%,rgba(4,6,13,0.50)_60%,rgba(4,6,13,0.15)_85%,transparent_100%)]" />

        {/* Bottom feather */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-b from-transparent via-[#080b13]/55 to-[#080b13]" />

        {/* Soft additional feather */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-6 -z-10 h-24 bg-[#080b13]/70 blur-3xl" />

        <div className="relative mx-auto flex min-h-[680px] w-full max-w-[1480px] flex-col justify-center px-6 py-14 lg:px-10 xl:px-12">

          {/* Small label */}
          <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-[#ed008c]/60 bg-[#ed008c]/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-[#ff008a]">
            <Star size={14} />
            Real Carmart Customers
          </div>

          {/* Main headline */}
          <h1 className="w-full max-w-[1000px] font-['Montserrat'] text-[clamp(38px,4.3vw,76px)] font-black italic uppercase leading-[0.98] tracking-[-0.045em]">

            <span className="block whitespace-nowrap pb-1 pr-8 text-white">
              Driving Dreams,
            </span>

            <span className="block w-max whitespace-nowrap bg-gradient-to-r from-[#f00085] to-[#a854b0] bg-clip-text pb-1 pr-8 text-transparent">
              Delivering
            </span>

            <span className="block w-max whitespace-nowrap bg-gradient-to-r from-[#b254b2] to-[#598fd2] bg-clip-text pb-1 pr-8 text-transparent">
              Quality Used
            </span>

            <span className="block w-max whitespace-nowrap bg-gradient-to-r from-[#559ad9] to-[#00d9ed] bg-clip-text pb-1 pr-8 text-transparent">
              Cars in Perth
            </span>

          </h1>

          {/* Description */}
          <p className="mt-7 max-w-[610px] font-[Inter] text-[clamp(16px,1.35vw,22px)] font-semibold leading-[1.45] text-gray-200">
            Meet the people who found their next car with Carmart Perth.
            Great cars, straight talking support and a team that has your back.
          </p>

          {/* Highlights */}
          <p className="mt-6 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-[#ff008b] sm:text-[13px]">
            ▸ Great Cars · Local Service · All Credit Types Considered
          </p>

          {/* Hero actions */}
          <div className="mt-9 flex flex-wrap items-center gap-4">

            {/* Browse inventory — inactive for now */}
            <span className="inline-flex min-h-[56px] items-center justify-center bg-gradient-to-r from-[#f00085] via-[#b44ab8] to-[#00d7ed] px-8 font-['Montserrat'] text-[15px] font-extrabold uppercase text-white shadow-[0_8px_30px_rgba(237,0,140,0.2)]">
              Browse Our Cars
            </span>

            {/* Phone */}
            <a
              href="tel:+61892726814"
              className="inline-flex min-h-[56px] items-center justify-center gap-3 border border-white/20 bg-[#0b0b12]/60 px-8 font-['Montserrat'] text-[15px] font-extrabold text-white"
            >
              <Phone size={17} />
              (08) 9272 6814
            </a>

          </div>
        </div>
      </section>

      {/* ==========================================
          CARMART STATISTICS
      ========================================== */}
      <section className="border-y border-white/5 bg-[#090a0e] text-white">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 px-6 py-8 md:grid-cols-4 xl:px-10">

          {[
            {
              value: "103",
              label: "VEHICLES IN STOCK",
              color: "text-cyan-400",
            },
            {
              value: "26",
              label: "TOP BRANDS",
              color: "text-pink-500",
            },
            {
              value: "50+",
              label: "YEARS COMBINED EXPERIENCE",
              color: "text-cyan-400",
            },
            {
              value: "4.9★",
              label: "GOOGLE RATING",
              color: "text-pink-500",
            },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={`flex flex-col items-center justify-center px-3 py-3 text-center ${
                index !== 0
                  ? "md:border-l md:border-white/10"
                  : ""
              }`}
            >
              <p className="font-['Montserrat'] text-3xl font-black tracking-tight sm:text-4xl">
                {stat.value}
              </p>

              <p
                className={`mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] sm:text-[12px] ${stat.color}`}
              >
                {stat.label}
              </p>
            </div>
          ))}

        </div>
      </section>
    </>
  );
}
