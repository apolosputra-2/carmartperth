import {
  CarFront,
  ShieldCheck,
  BadgeDollarSign,
  ArrowUpRight,
  Star,
  MapPin,
  Phone,
} from "lucide-react";
  
<section className="border-t border-white/5 bg-[#0a0b0f] px-6 py-20 text-white lg:py-24 xl:px-10">
    <div className="mx-auto w-full max-w-[1400px]">

        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">

        {/* Heading and description */}
        <div>
            <h2 className="font-['Montserrat'] text-[clamp(26px,2.5vw,38px)] font-black italic uppercase leading-tight tracking-[-0.035em]">

            <span className="text-white">
                FEATURED{" "}
            </span>

            <span className="inline-block bg-gradient-to-r from-[#00b8df] to-[#00e3ed] bg-clip-text pr-3 text-transparent">
                INVENTORY
            </span>

            </h2>

            <p className="mt-4 max-w-[520px] font-[Inter] text-[14px] leading-6 text-gray-400 sm:text-[15px]">
            Hand-picked vehicles offering exceptional value and
            reliability. Fully inspected and ready for delivery.
            </p>
        </div>

        {/* Inactive until inventory integration */}
        <span className="inline-flex w-fit cursor-default items-center gap-4 border border-[#414149] bg-[#111216] px-5 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-white">
            VIEW ALL STOCK
            <ArrowUpRight size={16} />
        </span>

        </div>

        {/* Reserved space for future Virtual Yard inventory */}
        <div className="mt-12 min-h-[100px]">
        {/* Vehicle cards will be added here after API integration */}
        </div>

    </div>
</section>
