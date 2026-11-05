
import Link from "next/link";

export default function FinanceCTASection() {
  return (
    <section
      id="finance-cta"
      className="relative overflow-hidden border-t border-white/10 bg-[#10151c] px-6 py-20 text-white sm:py-24 lg:py-28"
    >
      {/* Burgundy-to-teal background gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,#291020_0%,#201b29_48%,#0d3036_100%)]"
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col items-center text-center">

        {/* Heading */}
        <h2 className="max-w-[950px] font-['Montserrat'] text-[clamp(30px,4vw,54px)] font-black italic uppercase leading-[1.03] tracking-[-0.04em]">
          LET&apos;S FIND THE RIGHT CAR
          <br className="hidden sm:block" />
          {" "}FOR YOUR CIRCUMSTANCES
        </h2>

        {/* Description */}
        <p className="mt-7 max-w-[720px] font-[Inter] text-[16px] leading-7 text-gray-200 sm:text-[19px] sm:leading-8">
          Find out what finance options may be available — without
          affecting your credit score during the initial eligibility
          check.
        </p>

        {/* Finance disclaimer */}
        <p className="mt-4 max-w-[620px] font-[Inter] text-[13px] leading-6 text-gray-400 sm:text-[14px]">
          Finance is subject to lender approval, lending criteria
          and your individual circumstances.
        </p>

        {/* CTA button */}
        <Link
          href="/finance/apply"
          className="mt-10 inline-flex min-h-[64px] w-full max-w-[340px] items-center justify-center bg-white px-8 py-4 font-['Montserrat'] text-[17px] font-extrabold uppercase tracking-[0.02em] text-black transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-400 hover:shadow-[0_12px_35px_rgba(34,211,238,0.18)] sm:text-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-400"
        >
          CHECK YOUR OPTIONS
        </Link>

      </div>
    </section>
  );
}
