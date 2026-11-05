
import HeroSection from "@/components/HeroSection";
import CarmartPerthDifference from "@/components/CarmartPerthDifference";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import FAQSection from "@/components/FAQSection";
import FinanceCTASection from "@/components/FinanceCTASection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1320] pt-[132px] text-[#151515] sm:pt-[116px] md:pt-[84px]">

      {/* Navigation — keep your existing header here */}

      {/* Hero and statistics */}
      <HeroSection />

      {/* Why choose Carmart Perth */}
      <CarmartPerthDifference />

      {/* Customer reviews */}
      <GoogleReviewsSection />

      {/* Frequently asked questions */}
      <FAQSection />

      {/* Finance application CTA */}
      <FinanceCTASection />

      {/* Footer */}
      <Footer />

    </main>
  );
}
