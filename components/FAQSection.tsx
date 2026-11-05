
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";


const faqs = [
  {
    question: "Why should I buy a used car from Carmart Perth?",
    answer: `Carmart Perth is a family-owned used car dealership in Perth focused on making buying a car straightforward, comfortable, and transparent.

Our team has extensive combined motor-industry experience, and our goal is to help you find the right vehicle for your needs and budget — not simply sell you a car.

Our vehicles are mechanically inspected and prepared before sale, and eligible vehicles include warranty and roadside assistance, subject to applicable terms and conditions.

Looking for your next car? Browse our current used cars for sale in Perth.

Want to know what to check before buying? Read our guide to vehicle history reports and PPSR checks.`,
  },
  {
    question: "Can Carmart Perth help if I've had bad credit?",
    answer: `Potentially, yes. A previous default, missed payment, or decline doesn't automatically tell us whether finance is available today.

We first look at your current circumstances and then determine which options may be worth exploring.

Our team works hard to help customers find suitable finance options, including customers with previous credit difficulties.

All finance applications remain subject to lender criteria and approval.`,
  },
  {
    question: "Can I apply if I've already been declined somewhere else?",
    answer: `Yes. Being declined by one lender doesn't necessarily mean every lender will make the same decision.

Carmart Perth works with customers across a wide range of financial circumstances, including people with previous credit problems, defaults, or declined applications.

Every application is different and remains subject to lender criteria and approval.

One important tip: avoid submitting applications everywhere after a decline. Multiple credit applications may affect your credit file. It can be better to understand why you were declined before deciding on the next step.

Learn more about bad credit car finance in Perth.

You can also read our guide explaining car-loan interest rates and bad-credit finance.`,
  },
  {
    question: "Can I trade in my current car when buying another car?",
    answer: `Yes. Carmart Perth welcomes trade-ins.

You can provide the details of your existing vehicle, and our team can assess it as part of your next purchase.

If money is still owing on your current vehicle, let us know upfront so we can assess your complete situation.

The important number isn't simply what your trade-in is worth — it's also how much you owe and what your overall changeover position looks like.

Start by finding the vehicle you'd like to upgrade to in our used cars for sale.

If finance will be involved in your upgrade, our guide to understanding car-loan interest rates is also worth reading.`,
  },
  {
    question: "Can I get pre-approved for car finance before choosing a car?",
    answer: `Yes. In many cases, it makes sense to discuss your finance position before choosing a vehicle.

This can help establish a realistic price range and estimated repayments before you start shopping.

Carmart Perth can discuss your circumstances and help you understand the next steps.

Any finance approval is subject to lender assessment, lending criteria, and the vehicle ultimately selected.

Browse our current cars for sale in Perth, or read our bad credit car finance guide if previous credit problems are part of your situation.`,
  },
  {
    question: "Can I get more information?",
    answer: `Absolutely!

Start with the Carmart Perth Learning Centre, where we cover common customer questions about car finance, credit, buying used vehicles, warranties, trade-ins, and vehicle ownership.

Alternatively, speak directly with our team.

Phone: (08) 9272 6814

Email: sales@carmartperth.com.au

Visit us: 707 Albany Highway, East Victoria Park, WA 6101.`,
  },
  {
    question: "How do I know which used car is right for my budget?",
    answer: `The cheapest car isn't always the best-value car, and the most expensive vehicle you can finance isn't necessarily the right one either.

We recommend considering the total cost of owning a vehicle, including:

• Loan repayments
• Fuel consumption
• Servicing and maintenance
• Insurance
• Expected running costs
• Your everyday driving needs

Our team can help you compare suitable vehicles rather than simply directing you toward the highest-priced option.

Start by comparing our current used cars for sale and reading our guide to understanding car-loan interest rates.`,
  },
  {
    question: "Can I test-drive a used car before I decide to buy it?",
    answer: `Yes. A test drive is an important part of choosing the right used vehicle.

Don't just focus on how fast the car goes. Consider whether:

• You're comfortable in the driver's seat.
• Visibility is good.
• There's enough room for your family or work equipment.
• The controls are easy to use.
• The vehicle feels right for your everyday needs.

Browse our current Carmart Perth used-car range to find a vehicle you're interested in.

Before making your final decision, you can also learn about vehicle warranties, history reports, and PPSR checks.`,
  },
  {
    question: "Can Carmart Perth provide a PPSR history report before selling a used car?",
    answer: `Vehicle history is an important part of making an informed used-car purchase.

A Personal Property Securities Register (PPSR) check can provide valuable information about a vehicle, including whether:

• It has a registered security interest.
• It has been recorded as stolen.
• It has been recorded as written off.

At Carmart Perth, we take vehicle history seriously because what happened before you owned the car can be just as important as how it looks today.

Speak with our team about obtaining and reviewing the relevant vehicle history information.

You can also read our guide to understanding vehicle history reports and PPSR checks before browsing our current used cars for sale.`,
  },
  {
    question: "What makes Carmart Perth different from a typical used-car yard?",
    answer: `We're a family-owned Perth dealership, and our focus goes beyond making a single sale.

We want our customers to understand the vehicles they're buying, understand their finance arrangements where applicable, and feel comfortable returning to us for their next vehicle.

Our two owners and Head of Finance bring approximately 50 years of combined motor-industry experience.

Our approach includes:

• Vehicle preparation and mechanical inspections.
• Assistance with finance applications across a wide range of circumstances.
• Transparent communication throughout the buying process.
• Support after purchasing your vehicle.
• A customer-focused approach to finding the right car.

Explore our current Carmart Perth inventory, or learn more about how we help customers who have experienced credit difficulties.`,
  },
];


export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(
        null
    );

    const toggleFAQ = (index: number) => {
        setOpenIndex((current) =>
        current === index ? null : index
        );
    };

    return (
        <section
        id="faq"
        className="border-t border-white/10 bg-[#0a0b0f] px-6 py-20 text-white lg:py-24"
        >
        <div className="mx-auto max-w-[1200px]">

            {/* Section heading */}
            <div className="mb-14 text-center">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                FAQ
            </p>

            <h2 className="mx-auto mt-5 max-w-[900px] font-['Montserrat'] text-[clamp(30px,4.5vw,62px)] font-black italic uppercase leading-[1.04] tracking-[-0.045em]">
                YOU PROBABLY HAVE A LOT
                <br className="hidden sm:block" />
                {" "}OF QUESTIONS.
            </h2>

            <p className="mt-5 font-[Inter] text-[15px] leading-7 text-gray-300 sm:text-[18px]">
                Let&apos;s see if we can answer them for you.
            </p>
            </div>

            {/* Accordion */}
            <div className="mx-auto flex w-full max-w-[704px] flex-col gap-3">
            {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                <div
                    key={index}
                    className={`overflow-hidden rounded-lg border transition-colors duration-300 ${
                    isOpen
                        ? "border-cyan-400/40 bg-[#111318]"
                        : "border-white/15 bg-[#101115] hover:border-white/30"
                    }`}
                >
                    {/* Question button */}
                    <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    className="flex min-h-[64px] w-full items-center justify-between gap-5 px-6 py-4 text-left"
                    >
                    <span
                        className={`font-[Inter] text-[15px] font-semibold leading-6 transition-colors duration-300 sm:text-[16px] ${
                        isOpen
                            ? "text-cyan-400"
                            : "text-white"
                        }`}
                    >
                        {faq.question}
                    </span>

                    <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                        isOpen
                            ? "rotate-180 border-cyan-400/50 text-cyan-400"
                            : "border-white/20 bg-white/5 text-gray-400"
                        }`}
                    >
                        <ChevronDown size={16} />
                    </span>
                    </button>

                    {/* Animated answer dropdown */}
                    <div
                    id={`faq-answer-${index}`}
                    aria-hidden={!isOpen}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                        isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                    >
                    <div className="min-h-0 overflow-hidden">
                        <div className="border-t border-white/10 px-6 pb-6 pt-5">
                        {faq.answer ? (
                            <p className="whitespace-pre-line font-[Inter] text-[14px] leading-7 text-gray-300 sm:text-[15px]">
                            {faq.answer}
                            </p>
                        ) : (
                            // TODO: Replace with the corresponding FAQ answer.
                            <p className="font-[Inter] text-[14px] italic leading-7 text-gray-500">
                            Answer coming soon.
                            </p>
                        )}
                        </div>
                    </div>
                    </div>
                </div>
                );
            })}
            </div>
        </div>
        </section>
    );
}
