
import {
  CarFront,
  ShieldCheck,
  BadgeDollarSign,
  ArrowUpRight,
  Star,
} from "lucide-react";

export default function CarmartPerthDifference() {
  const features = [
    {
      title: "Bad Credit Finance",
      description:
        "Your credit history is only part of your story. Our finance team works with all credit profiles — defaults, bankruptcies, and Centrelink welcome.",
      Icon: BadgeDollarSign,
      color: "text-cyan-400",
    },
    {
      title: "Sell Your Car",
      description:
        "Top prices paid for your trade in. We also will buy cars for cash and get you a uber home just the type of guys we are.",
      Icon: CarFront,
      color: "text-pink-500",
    },
    {
      title: "Smart Finance Application Support",
      description:
        "Our intelligent support system helps us present your application clearly and quickly to the correct specialist lenders without affecting your credit score initially unlike most other establishments.",
      Icon: Star,
      color: "text-cyan-400",
    },
    {
      title: "Trusted Local Yard",
      description:
        "Every vehicle is mechanically and safety inspected before sale, then checked again before customer collection. WA-owned and family-run.",
      Icon: ShieldCheck,
      color: "text-pink-500",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0d0e12] px-6 py-20 text-white lg:py-24 xl:px-10">
      <div className="mx-auto w-full max-w-[1400px]">

        {/* Section heading */}
        <div className="mb-16 text-center">
          <h2 className="font-['Montserrat'] text-[clamp(24px,2.3vw,38px)] font-black italic uppercase leading-tight tracking-[-0.035em]">
            <span className="text-white">
              THE CARMART PERTH{" "}
            </span>

            <span className="bg-gradient-to-r from-[#f00085] to-[#b44bb7] bg-clip-text pr-3 text-transparent">
              DIFFERENCE
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-[720px] font-[Inter] text-[14px] leading-7 text-gray-400 sm:text-[15px]">
            We make buying a used car simpler, clearer and more personal.
            Transparent pricing, straight-talking finance support,
            and a curated selection of quality vehicles.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, Icon, color }) => (
            <article
              key={title}
              className="flex min-h-[340px] flex-col rounded-xl border border-[#303139] bg-[#17181d] p-7 transition-colors hover:border-[#454650]"
            >
              {/* Icon */}
              <div className={`mb-8 ${color}`}>
                <Icon size={43} strokeWidth={2} />
              </div>

              {/* Title */}
              <h3 className="font-['Montserrat'] text-[18px] font-extrabold leading-[1.5] text-white">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-3 font-[Inter] text-[14px] leading-[1.45] text-gray-400">
                {description}
              </p>

              {/* Learn more — inactive for now */}
              <div className="mt-auto flex justify-center pt-8">
                <span className="inline-flex items-center gap-3 border border-[#4a4b53] bg-[#131419] px-5 py-2.5 font-[Inter] text-[13px] font-semibold text-white">
                  Learn more
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Warranty information */}
        <div className="mx-auto mt-24 max-w-[800px] text-center font-[Inter] text-[14px] leading-[1.5] text-gray-300">
          <p>
            <span className="font-bold text-cyan-400">
              Every eligible vehicle
            </span>{" "}
            All vehicles come with at least a 12 month comprehensive
            warranty and roadside assistance Australia wide, extendable
            up to 5 years.{" "}
            <span className="text-gray-500">
              Terms, conditions and exclusions apply. Confirm warranty
              details with our team prior to purchase.
            </span>
          </p>
        </div>

      </div>
    </section>
  );
}
